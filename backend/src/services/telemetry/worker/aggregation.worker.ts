import * as bufferService from "../buffer/buffer.service";
import { createReading } from "../operations/crud";
import { getAllDevices } from "../../device.service";
import { REQUIRED_POINTS_1M } from "../aggregation/data-quality";
import redis from "../../redis.service";
import * as alertEvaluation from "../../alert-evaluation.service";
import * as notificationService from "../../notification.service";
import { isDeviceInMaintenance } from "../../maintenance.service";

/**
 * Aggregation worker - processes buffered 5-second readings into 1-minute records
 * Runs as background interval in backend process
 */

let workerInterval: NodeJS.Timeout | null = null;
let isRunning = false;

/**
 * Process one minute of buffered data for a device
 */
const processMinuteBuffer = async (
  deviceId: string,
  minuteBucket: string,
): Promise<boolean> => {
  try {
    console.log(`📊 Processing buffer: ${deviceId} @ ${minuteBucket}`);

    // Get all readings from Redis buffer
    const buffer = await bufferService.getMinuteBuffer(deviceId, minuteBucket);

    if (Object.keys(buffer).length === 0) {
      console.log(`   ⏭️  No data in buffer for ${minuteBucket}`);
      return false;
    }

    // Calculate averages and counts
    const readings: Record<string, number> = {};
    const counts: Record<string, number> = {};

    for (const [parameter, readingsList] of Object.entries(buffer)) {
      if (readingsList.length === 0) continue;

      // Calculate average
      const sum = readingsList.reduce((acc, r) => acc + r.value, 0);
      readings[parameter] = sum / readingsList.length;

      // Store count for validation
      counts[parameter] = readingsList.length;
    }

    // Prepare timestamp (start of minute)
    const observedAt = new Date(minuteBucket + ":00Z");

    // Create 1-minute record with count metadata for validation
    await createReading({
      deviceId,
      observedAt,
      readings,
      dataCounts: counts, // Pass counts for insufficient_data validation
    });

    // Log counts for monitoring
    const insufficientParams = Object.entries(counts)
      .filter(([_, count]) => count < REQUIRED_POINTS_1M)
      .map(([param, count]) => `${param}:${count}`);

    if (insufficientParams.length > 0) {
      console.log(
        `   ⚠️  Insufficient data: ${insufficientParams.join(
          ", ",
        )} (need ${REQUIRED_POINTS_1M})`,
      );
    } else {
      console.log(`   ✅ All parameters have sufficient data`);
    }

    // Clear buffer after successful processing
    await bufferService.clearMinuteBuffer(deviceId, minuteBucket);

    // ========================================
    // Alert Evaluation: Check thresholds
    // Skip if device is in maintenance
    // ========================================
    try {
      const inMaintenance = await isDeviceInMaintenance(deviceId, {
        start: observedAt,
        end: observedAt,
      });

      if (inMaintenance) {
        console.log(`   🔧 Device in maintenance, skipping alert evaluation`);
      } else {
        const alertResults = await alertEvaluation.batchEvaluateParameters(
          deviceId,
          observedAt,
          readings,
        );

        if (alertResults.length > 0) {
          console.log(`   🚨 ${alertResults.length} alert(s) triggered`);

          // Send notifications for each triggered alert
          for (const result of alertResults) {
            if (result.alertHistory) {
              await notificationService.sendMultiChannelNotification(
                result.alertHistory,
              );
            }
          }
        }
      }
    } catch (alertError) {
      // Don't fail aggregation if alert evaluation fails
      console.error("⚠️  Alert evaluation error:", alertError);
    }

    return true;
  } catch (error) {
    console.error(
      `❌ Error processing buffer ${deviceId} @ ${minuteBucket}:`,
      error,
    );
    return false;
  }
};

/**
 * Get minute bucket for aggregation (previous minute)
 */
const getPreviousMinuteBucket = (): string => {
  const now = new Date();
  const prevMinute = new Date(now.getTime() - 60 * 1000); // 1 minute ago

  const year = prevMinute.getUTCFullYear();
  const month = String(prevMinute.getUTCMonth() + 1).padStart(2, "0");
  const day = String(prevMinute.getUTCDate()).padStart(2, "0");
  const hour = String(prevMinute.getUTCHours()).padStart(2, "0");
  const minute = String(prevMinute.getUTCMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
};

/**
 * Run aggregation for all active devices
 */
const runAggregation = async (): Promise<void> => {
  if (isRunning) {
    console.log("⏸️  Aggregation already running, skipping...");
    return;
  }

  // Check if Redis is available
  if (!redis.isRedisAvailable()) {
    console.log("⏭️  Redis unavailable, skipping aggregation");
    return;
  }

  isRunning = true;
  const startTime = Date.now();

  try {
    console.log("\n🔄 Starting aggregation worker...");

    // Get previous minute bucket
    const minuteBucket = getPreviousMinuteBucket();
    console.log(`⏰ Processing minute: ${minuteBucket}`);

    // Get all active devices
    const devicesResult = await getAllDevices({});
    const devices = devicesResult.devices.filter(
      (d: any) => d.status === "active",
    );

    console.log(`📱 Found ${devices.length} active devices`);

    // Process each device
    let processedCount = 0;
    for (const device of devices) {
      const processed = await processMinuteBuffer(device.id, minuteBucket);
      if (processed) processedCount++;
    }

    const duration = Date.now() - startTime;
    console.log(
      `✅ Aggregation complete: ${processedCount}/${devices.length} devices processed in ${duration}ms\n`,
    );
  } catch (error) {
    console.error("❌ Aggregation worker error:", error);
  } finally {
    isRunning = false;
  }
};

/**
 * Start the aggregation worker (runs every minute)
 */
export const startWorker = (): void => {
  if (workerInterval) {
    console.log("⚠️  Aggregation worker already running");
    return;
  }

  console.log("🚀 Starting aggregation worker (1-minute interval)");

  // Run immediately on start (for testing)
  // Comment this out in production to wait for first minute
  // runAggregation();

  // Run every minute at :15 seconds (15s delay after minute boundary)
  // This gives MQTT data time to arrive before processing the previous minute
  const WORKER_DELAY_SECONDS = 15;
  const now = new Date();
  const currentSeconds = now.getSeconds();
  const secondsUntilNextRun =
    currentSeconds < WORKER_DELAY_SECONDS
      ? WORKER_DELAY_SECONDS - currentSeconds
      : 60 - currentSeconds + WORKER_DELAY_SECONDS;

  // Wait until next :15, then start interval
  setTimeout(() => {
    runAggregation(); // Run first time
    workerInterval = setInterval(runAggregation, 60 * 1000); // Then every minute
  }, secondsUntilNextRun * 1000);

  console.log(
    `⏰ Next aggregation in ${secondsUntilNextRun} seconds (at :${WORKER_DELAY_SECONDS})`,
  );
};

/**
 * Stop the aggregation worker
 */
export const stopWorker = (): void => {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    console.log("🛑 Aggregation worker stopped");
  }
};

/**
 * Check if worker is running
 */
export const isWorkerRunning = (): boolean => {
  return workerInterval !== null;
};

export default {
  startWorker,
  stopWorker,
  isWorkerRunning,
  runAggregation, // Exposed for manual triggering
};
