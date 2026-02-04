import prisma from "../src/config/database";

async function main() {
  console.log("🚨 Seeding alert history data...");

  // Get existing device
  const device = await prisma.device.findFirst({
    where: { deviceCode: "PETRONAS-STATION-01" },
  });

  if (!device) {
    console.error("❌ No device found. Run main seed first: npm run seed");
    process.exit(1);
  }

  console.log(`📡 Using device: ${device.name}`);

  // Get super admin user
  const admin = await prisma.user.findFirst({
    where: { email: "superAdmin@petronas.com" },
  });

  if (!admin) {
    console.error("❌ No admin user found. Run main seed first: npm run seed");
    process.exit(1);
  }

  // Create alert thresholds
  console.log("\n📋 Creating alert thresholds...");

  const thresholds = [
    {
      parameter: "so2",
      thresholdType: "warning",
      operator: ">",
      value: 0.5,
      cooldownMinutes: 30,
    },
    {
      parameter: "so2",
      thresholdType: "critical",
      operator: ">",
      value: 1.0,
      cooldownMinutes: 30,
    },
    {
      parameter: "so2",
      thresholdType: "emergency",
      operator: ">",
      value: 2.0,
      cooldownMinutes: 15,
    },
    {
      parameter: "temp",
      thresholdType: "warning",
      operator: ">",
      value: 35.0,
      cooldownMinutes: 60,
    },
    {
      parameter: "temp",
      thresholdType: "critical",
      operator: ">",
      value: 40.0,
      cooldownMinutes: 30,
    },
    {
      parameter: "h2s",
      thresholdType: "critical",
      operator: ">",
      value: 0.15,
      cooldownMinutes: 30,
    },
    {
      parameter: "humidity",
      thresholdType: "warning",
      operator: "<",
      value: 30.0,
      cooldownMinutes: 120,
    },
  ];

  const createdThresholds: any[] = [];

  for (const thresholdData of thresholds) {
    // Check if threshold already exists
    let threshold = await prisma.alertThreshold.findFirst({
      where: {
        parameter: thresholdData.parameter,
        thresholdType: thresholdData.thresholdType,
        deviceId: null, // Global thresholds only
      },
    });

    if (!threshold) {
      // Create new threshold
      threshold = await prisma.alertThreshold.create({
        data: {
          deviceId: null, // Global threshold (affects all devices)
          parameter: thresholdData.parameter,
          thresholdType: thresholdData.thresholdType,
          operator: thresholdData.operator,
          value: thresholdData.value,
          enabled: true,
          cooldownMinutes: thresholdData.cooldownMinutes,
          createdBy: admin.id,
        },
      });
    }

    createdThresholds.push(threshold);
    console.log(
      `  ✅ ${thresholdData.parameter.toUpperCase()} ${thresholdData.operator} ${thresholdData.value} (${thresholdData.thresholdType})`,
    );
  }

  // Create alert history entries
  console.log("\n🚨 Creating alert history entries...");

  const now = new Date();
  const alertHistoryData = [
    // Emergency alert - 30 minutes ago, unacknowledged
    {
      thresholdId: createdThresholds.find(
        (t) => t.parameter === "so2" && t.thresholdType === "emergency",
      )?.id,
      parameter: "so2",
      observedAt: new Date(now.getTime() - 30 * 60 * 1000),
      actualValue: 2.5,
      thresholdValue: 2.0,
      thresholdType: "emergency",
      acknowledged: false,
    },
    // Critical alert - 1 hour ago, unacknowledged
    {
      thresholdId: createdThresholds.find(
        (t) => t.parameter === "temp" && t.thresholdType === "critical",
      )?.id,
      parameter: "temp",
      observedAt: new Date(now.getTime() - 60 * 60 * 1000),
      actualValue: 42.3,
      thresholdValue: 40.0,
      thresholdType: "critical",
      acknowledged: false,
    },
    // Critical H2S - 45 minutes ago, acknowledged
    {
      thresholdId: createdThresholds.find(
        (t) => t.parameter === "h2s" && t.thresholdType === "critical",
      )?.id,
      parameter: "h2s",
      observedAt: new Date(now.getTime() - 45 * 60 * 1000),
      actualValue: 0.18,
      thresholdValue: 0.15,
      thresholdType: "critical",
      acknowledged: true,
      acknowledgedBy: admin.id,
      acknowledgedAt: new Date(now.getTime() - 20 * 60 * 1000),
    },
    // Warning SO2 - 2 hours ago, acknowledged
    {
      thresholdId: createdThresholds.find(
        (t) => t.parameter === "so2" && t.thresholdType === "warning",
      )?.id,
      parameter: "so2",
      observedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      actualValue: 0.65,
      thresholdValue: 0.5,
      thresholdType: "warning",
      acknowledged: true,
      acknowledgedBy: admin.id,
      acknowledgedAt: new Date(now.getTime() - 90 * 60 * 1000),
    },
    // Warning Temperature - 3 hours ago, unacknowledged
    {
      thresholdId: createdThresholds.find(
        (t) => t.parameter === "temp" && t.thresholdType === "warning",
      )?.id,
      parameter: "temp",
      observedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      actualValue: 36.8,
      thresholdValue: 35.0,
      thresholdType: "warning",
      acknowledged: false,
    },
    // Warning Humidity - 4 hours ago, acknowledged
    {
      thresholdId: createdThresholds.find(
        (t) => t.parameter === "humidity" && t.thresholdType === "warning",
      )?.id,
      parameter: "humidity",
      observedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      actualValue: 25.5,
      thresholdValue: 30.0,
      thresholdType: "warning",
      acknowledged: true,
      acknowledgedBy: admin.id,
      acknowledgedAt: new Date(now.getTime() - 3.5 * 60 * 60 * 1000),
    },
    // Critical SO2 - 5 hours ago, acknowledged
    {
      thresholdId: createdThresholds.find(
        (t) => t.parameter === "so2" && t.thresholdType === "critical",
      )?.id,
      parameter: "so2",
      observedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      actualValue: 1.2,
      thresholdValue: 1.0,
      thresholdType: "critical",
      acknowledged: true,
      acknowledgedBy: admin.id,
      acknowledgedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
    },
    // Recent warning - 10 minutes ago, unacknowledged
    {
      thresholdId: createdThresholds.find(
        (t) => t.parameter === "temp" && t.thresholdType === "warning",
      )?.id,
      parameter: "temp",
      observedAt: new Date(now.getTime() - 10 * 60 * 1000),
      actualValue: 37.5,
      thresholdValue: 35.0,
      thresholdType: "warning",
      acknowledged: false,
    },
  ];

  let successCount = 0;

  for (const alertData of alertHistoryData) {
    if (!alertData.thresholdId) {
      console.log(
        `  ⚠️  Skipping alert for ${alertData.parameter} - threshold not found`,
      );
      continue;
    }

    try {
      const alert = await prisma.alertHistory.create({
        data: {
          thresholdId: alertData.thresholdId,
          deviceId: device.id,
          parameter: alertData.parameter,
          observedAt: alertData.observedAt,
          actualValue: alertData.actualValue,
          thresholdValue: alertData.thresholdValue,
          thresholdType: alertData.thresholdType,
          acknowledged: alertData.acknowledged,
          acknowledgedBy: alertData.acknowledgedBy || null,
          acknowledgedAt: alertData.acknowledgedAt || null,
        },
      });

      successCount++;
      const ackStatus = alert.acknowledged ? "✅ Acknowledged" : "⏳ Pending";
      console.log(
        `  🚨 ${alertData.thresholdType.toUpperCase().padEnd(9)} | ${alertData.parameter.toUpperCase().padEnd(8)} = ${alertData.actualValue} | ${ackStatus}`,
      );
    } catch (error) {
      console.error(
        `  ❌ Error creating alert for ${alertData.parameter}:`,
        error,
      );
    }
  }

  console.log(`\n✅ Created ${successCount} alert history entries`);
  console.log("\n📊 Summary:");
  console.log(`   - Emergency alerts: 1 (unacknowledged)`);
  console.log(`   - Critical alerts: 3 (1 unack, 2 ack)`);
  console.log(`   - Warning alerts: 4 (2 unack, 2 ack)`);
  console.log("\n🎉 Alert seeding complete!");
  console.log("\n💡 You can now view these alerts in the Alert History page");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding alert data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
