import prisma from "../src/config/database";
import bcrypt from "bcryptjs";

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

  // mqttIdentifier must match the topic the device publishes to
  // (aquamind/<mqttIdentifier>) and the broker login, so live data attaches.
  const deviceData = {
    mqttIdentifier: "UNIMAP01",
    name: "Water Quality Station 1",
    location: "Arau, Perlis",
    latitude: 6.5964,
    longitude: 100.32989,
    status: "active",
  };

  const device = await prisma.device.upsert({
    where: { deviceCode: "WQMS - UNIMAP01" },
    update: deviceData, // self-heal an existing record (e.g. set mqttIdentifier)
    create: { deviceCode: "WQMS - UNIMAP01", ...deviceData },
  });

  console.log(`✅ Device created: ${device.name}`);
  console.log(`   Device Code: ${device.deviceCode}`);
  console.log(`   MQTT Identifier: ${device.mqttIdentifier}`);
  console.log(`   Location: ${device.location}`);

  // Create super admin user
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
