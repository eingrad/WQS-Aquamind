import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearTelemetryData() {
  try {
    console.log("🗑️  Clearing all telemetry data...");

    // Delete validation_status first (has foreign key to telemetry_processed)
    const validationResult = await prisma.validationStatus.deleteMany({});
    console.log(
      `✅ Deleted ${validationResult.count} validation status records`
    );

    // Then delete telemetry_processed records
    const result = await prisma.telemetryProcessed.deleteMany({});

    console.log(`✅ Deleted ${result.count} telemetry records successfully!`);
  } catch (error) {
    console.error("❌ Error deleting data:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearTelemetryData();
