import prisma from "../src/config/database";

async function main() {
  console.log("🌱 Seeding database...");

  // Seed roles
  const roles = [
    {
      roleId: "admin",
      roleName: "Administrator",
      description:
        "Full system access including user management and system configuration",
    },
    {
      roleId: "user",
      roleName: "User",
      description: "Standard user access to view and interact with data",
    },
    {
      roleId: "qa_qc",
      roleName: "QA/QC",
      description:
        "Quality Assurance/Quality Control - can validate data and submit approval requests",
    },
    {
      roleId: "technician",
      roleName: "Technician",
      description:
        "Field technician - can manage devices and upload sensor data",
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { roleId: role.roleId },
      update: {},
      create: role,
    });
  }
  console.log("✅ Default roles created");

  // Seed devices
  console.log("\n📡 Creating devices...");

  const device = await prisma.device.upsert({
    where: { deviceCode: "WQS-STATION-01" },
    update: {},
    create: {
      deviceCode: "WQS-STATION-01",
      name: "AquaMind Water Quality Monitoring Station 1",
      location: "River Station, Johor",
      latitude: 1.3668593813920302,
      longitude: 104.10786207528017,
      status: "active",
    },
  });

  console.log(`✅ Device created: ${device.name}`);
  console.log(`   Device Code: ${device.deviceCode}`);
  console.log(`   Location: ${device.location}`);

  // Create super admin user
  const bcrypt = require("bcryptjs");
  const hashedPassword = await bcrypt.hash("Test@1234", 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@aquamind.local" },
    update: {},
    create: {
      email: "admin@aquamind.local",
      passwordHash: hashedPassword,
      fullName: "Super Admin",
      isActive: true,
    },
  });

  // Assign admin role
  await prisma.userRole.upsert({
    where: { userId: superAdmin.id },
    update: {},
    create: {
      userId: superAdmin.id,
      roleId: "admin",
    },
  });

  console.log("✅ Created super admin user");
  console.log(`   Email: admin@aquamind.local`);
  console.log(`   Password: Test@1234`);
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
