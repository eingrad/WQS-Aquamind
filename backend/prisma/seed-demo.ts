/**
 * Demo telemetry generator (for client demonstrations).
 *
 * Generates realistic 1-minute water-quality readings for every device, ending
 * "now", with natural daily cycles kept inside Malaysia NWQS Class II ranges so
 * the dashboards/charts look healthy and alive.
 *
 * Run:  npx ts-node prisma/seed-demo.ts
 * Span: defaults to 30 days, override with  DEMO_DAYS=7 npx ts-node prisma/seed-demo.ts
 *
 * Re-runnable: it deletes existing telemetry for each device before inserting.
 */
import prisma from "../src/config/database";

const DAYS = Number(process.env.DEMO_DAYS) || 30;
const STEP_MINUTES = 1; // native cadence: sensor sends 1-minute averaged data
const BATCH_SIZE = 5000;

const rnd = (min: number, max: number) => Math.random() * (max - min) + min;
const round = (v: number, d: number) => {
  const f = 10 ** d;
  return Math.round(v * f) / f;
};

/** -1..1 daily oscillation, peaking around 15:00 local time. */
const dailyWave = (date: Date) => {
  const hour = date.getHours() + date.getMinutes() / 60;
  return Math.sin((2 * Math.PI * (hour - 9)) / 24);
};

/** Build one realistic reading. `wave` is the daily factor, `n` a 0..1 ramp. */
function makeReading(deviceId: string, observedAt: Date) {
  const w = dailyWave(observedAt); // -1 .. 1
  const n = (w + 1) / 2; // 0 .. 1
  // Slow multi-day drift for depth (tide/rainfall feel)
  const dayPhase = Math.sin((2 * Math.PI * observedAt.getTime()) / (3 * 86400000));

  return {
    deviceId,
    observedAt,
    // Water temperature peaks in the afternoon (Class II 20–35 °C)
    tempValue: round(28 + 3 * w + rnd(-0.3, 0.3), 2),
    // pH slightly higher midday from photosynthesis (Class II 6–9)
    phValue: round(7.4 + 0.3 * w + rnd(-0.05, 0.05), 3),
    // Dissolved oxygen tracks daylight, kept above the 5 mg/L Class II floor
    doValue: round(6.8 + 1.0 * w + rnd(-0.2, 0.2), 3),
    // Ammonia-N (Class II ≤ 0.3 mg/L)
    nh3nValue: round(0.1 + 0.05 * n + rnd(-0.015, 0.015), 4),
    // COD (Class II ≤ 25 mg/L)
    codValue: round(12 + 4 * n + rnd(-2, 2), 3),
    // BOD (Class II ≤ 3 mg/L)
    bodValue: round(1.6 + 0.6 * n + rnd(-0.25, 0.25), 3),
    // TSS (Class II ≤ 50 mg/L)
    tssValue: round(25 + 10 * n + rnd(-5, 5), 3),
    // Pressure near sea level (Class II 95–106 kPa)
    pressureValue: round(101.3 + 0.4 * w + rnd(-0.15, 0.15), 2),
    // Water depth with slow drift
    depthValue: round(2.5 + 0.25 * dayPhase + 0.1 * w + rnd(-0.03, 0.03), 3),
    dataQuality: "valid",
  };
}

async function main() {
  console.log(`🌊 Generating ${DAYS} days of demo telemetry (1-min cadence)...`);

  const devices = await prisma.device.findMany();
  if (devices.length === 0) {
    console.error("❌ No devices found. Create a device first.");
    process.exit(1);
  }

  // Align "now" to the start of the current minute
  const end = new Date();
  end.setSeconds(0, 0);
  const start = new Date(end.getTime() - DAYS * 86400000);
  const totalPerDevice = Math.floor((end.getTime() - start.getTime()) / (STEP_MINUTES * 60000));

  for (const device of devices) {
    console.log(`\n📡 ${device.name} (${device.deviceCode})`);

    const deleted = await prisma.telemetryProcessed.deleteMany({
      where: { deviceId: device.id },
    });
    if (deleted.count > 0) {
      console.log(`   🗑️  Cleared ${deleted.count} existing reading(s)`);
    }

    let batch: ReturnType<typeof makeReading>[] = [];
    let inserted = 0;

    for (let i = 0; i < totalPerDevice; i++) {
      const observedAt = new Date(start.getTime() + i * STEP_MINUTES * 60000);
      batch.push(makeReading(device.id, observedAt));

      if (batch.length >= BATCH_SIZE) {
        await prisma.telemetryProcessed.createMany({ data: batch });
        inserted += batch.length;
        process.stdout.write(`\r   ⏳ Inserted ${inserted}/${totalPerDevice}`);
        batch = [];
      }
    }
    if (batch.length > 0) {
      await prisma.telemetryProcessed.createMany({ data: batch });
      inserted += batch.length;
    }
    process.stdout.write(`\r   ✅ Inserted ${inserted} readings              \n`);
  }

  console.log("\n🎉 Demo telemetry generation complete!");
}

main()
  .catch((e) => {
    console.error("\n❌ Error generating demo data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
