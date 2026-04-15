import prisma from "../config/database";
import {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
} from "../utils/password";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  role: "admin" | "user" | "qa_qc" | "technician";
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    roleName: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

/**
 * Register a new user
 */
export const register = async (input: RegisterInput): Promise<AuthResponse> => {
  const { email, password, fullName, role } = input;

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    throw new Error(passwordValidation.message);
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Check if role exists
  const roleExists = await prisma.role.findUnique({
    where: { roleId: role },
  });

  if (!roleExists) {
    throw new Error(`Invalid role: ${role}`);
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      isActive: true,
    },
  });

  // Assign role
  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: role,
    },
  });

  // Generate tokens
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: role,
      roleName: roleExists.roleName,
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  };
};

/**
 * Login user
 */
export const login = async (input: LoginInput): Promise<AuthResponse> => {
  const { email, password } = input;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      userRole: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  // Check if user is active
  if (!user.isActive) {
    throw new Error("Account is inactive. Please contact administrator.");
  }

  // Check account lockout
  if (user.lockUntil && user.lockUntil > new Date()) {
    const remainingTime = Math.ceil(
      (user.lockUntil.getTime() - Date.now()) / 1000 / 60
    );
    throw new Error(
      `Account is locked. Try again in ${remainingTime} minutes.`
    );
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    // Increment login attempts
    const newAttempts = user.loginAttempts + 1;
    const updateData: any = {
      loginAttempts: newAttempts,
    };

    // Lock account after 5 failed attempts
    if (newAttempts >= 5) {
      updateData.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    throw new Error("Invalid credentials");
  }

  // Reset login attempts on successful login
  await prisma.user.update({
    where: { id: user.id },
    data: {
      loginAttempts: 0,
      lockUntil: null,
      lastLogin: new Date(),
    },
  });

  const role = user.userRole?.roleId || "user";
  const roleName = user.userRole?.role?.roleName || role;

  // Generate tokens
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: role,
      roleName: roleName,
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  };
};

/**
 * Revoke a refresh token by storing its JTI in the blacklist
 */
export const revokeRefreshToken = async (
  jti: string,
  userId: string,
  expiresAt: Date
): Promise<void> => {
  await prisma.revokedToken.upsert({
    where: { jti },
    update: {},
    create: {
      jti,
      userId,
      expiresAt,
    },
  });
};

/**
 * Check if a refresh token has been revoked
 */
export const isTokenRevoked = async (jti: string): Promise<boolean> => {
  const revoked = await prisma.revokedToken.findUnique({
    where: { jti },
  });
  return revoked !== null;
};

/**
 * Delete all revoked-token rows that have already expired.
 * Safe to call at any time; returns the number of rows removed.
 */
export const purgeExpiredTokens = async (): Promise<number> => {
  const { count } = await prisma.revokedToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return count;
};

/**
 * Refresh access token using refresh token
 */
export const refresh = async (
  userId: string,
  email: string,
  role: string,
  jti?: string,
  exp?: number
): Promise<{
  accessToken: string;
  refreshToken: string;
}> => {
  // Check if the refresh token has been revoked
  if (jti) {
    const revoked = await isTokenRevoked(jti);
    if (revoked) {
      throw new Error("Refresh token has been revoked");
    }

    // Rotate: revoke the old refresh token so it can't be replayed
    const expiresAt = exp
      ? new Date(exp * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await revokeRefreshToken(jti, userId, expiresAt);
  }

  // Verify user still exists and is active, and fetch current role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRole: true,
    },
  });

  if (!user || !user.isActive) {
    throw new Error("User not found or inactive");
  }

  // Use the current role from the database, not from the old token
  const currentRole = user.userRole?.roleId || "user";

  // Generate new tokens
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: currentRole,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    accessToken,
    refreshToken,
  };
};

/**
 * Get user profile
 */
export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
      userRole: {
        select: {
          roleId: true,
          role: {
            select: {
              roleName: true,
              description: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};
