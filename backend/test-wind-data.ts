import { PrismaClient } from "@prisma/client";
import { getTimeSeriesData } from "./src/services/telemetry/operations/aggregation";

const prisma = new PrismaClient();

async function test() {
  const device = await prisma.device.findFirst();

  if (!device) {
    console.log("No devices found");
    return;
  }

  const now = new Date();
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

  console.log("Testing 1-hour aggregation...");
  const data = await getTimeSeriesData({
    deviceId: device.id,
    startDate: sixHoursAgo,
    endDate: now,
    interval: "1h",
    parameters: "so2,windSpeed,windDirection",
  });

  console.log(`\nGot ${data.length} hourly records`);

  if (data.length > 0) {
    console.log("\nFirst record keys:", Object.keys(data[0]));
    console.log("\nFirst record:", JSON.stringify(data[0], null, 2));
  }
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
