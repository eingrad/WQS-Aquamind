import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import deviceRoutes from "./routes/device.routes";
import telemetryRoutes from "./routes/telemetry.routes";
import liveDataRoutes from "./routes/liveData.routes";
import maintenanceRoutes from "./routes/maintenance.routes";
import validationRoutes from "./routes/validation.routes";
import alertRoutes from "./routes/alert.routes";
import reportRoutes from "./routes/report.routes";
import calibrationRoutes from "./routes/calibration.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
import logger from "./config/logger";
import { purgeExpiredTokens } from "./services/auth.service";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// CORS - Restrict to allowed origin(s)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  }),
);

// Middleware
app.use(helmet());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
const API_PREFIX = process.env.API_PREFIX || "/api";

// Mount auth routes
app.use(`${API_PREFIX}/auth`, authRoutes);

// Mount user routes
app.use(`${API_PREFIX}/users`, userRoutes);

// Mount device routes
app.use(`${API_PREFIX}/devices`, deviceRoutes);

// Mount telemetry routes
app.use(`${API_PREFIX}/sensors`, telemetryRoutes);

// Mount live data routes (10s polling)
app.use(`${API_PREFIX}/live`, liveDataRoutes);

// Mount validation routes (for QA/QC validation table)
app.use(`${API_PREFIX}/validation`, validationRoutes);

// Mount alert routes (for threshold and notification management)
app.use(`${API_PREFIX}/alerts`, alertRoutes);

// Mount maintenance routes
app.use(API_PREFIX, maintenanceRoutes);

// Mount report routes
app.use(`${API_PREFIX}/reports`, reportRoutes);

// Mount calibration routes (sensor offset/slope correction)
app.use(`${API_PREFIX}/calibration`, calibrationRoutes);

app.get(API_PREFIX, (req: Request, res: Response) => {
  res.json({
    message: "AquaMind Water Quality Monitoring API",
    version: "1.0.0",
  });
});

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Error handlers (must be last)
app.use(errorHandler);

// Revoked-token cleanup job
const CLEANUP_INTERVAL_MS =
  Number(process.env.REVOKED_TOKEN_CLEANUP_INTERVAL_MS) || 60 * 60 * 1000; // default: 1 hour

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

async function runTokenCleanup() {
  try {
    const removed = await purgeExpiredTokens();
    if (removed > 0) {
      logger.info(`🗑️  Purged ${removed} expired revoked-token row(s)`);
    }
  } catch (err) {
    logger.error("Failed to purge expired revoked tokens:", err);
  }
}

// Start server
const server = app.listen(PORT, async () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`🌐 API URL: http://localhost:${PORT}${API_PREFIX}`);

  // Aggregation worker disabled — sensor sends 1-minute pre-averaged data,
  // so MQTT handler saves directly to DB (no buffering needed).

  // Start MQTT subscriber (for live sensor data ingestion)
  try {
    const { startMqttSubscriber } = await import("./services/mqtt.service");
    startMqttSubscriber();
    logger.info("✅ MQTT subscriber started");
  } catch (error) {
    logger.error("Failed to start MQTT subscriber:", error);
    logger.warn("📝 System will continue without MQTT — no live data ingestion");
  }

  // Start revoked-token cleanup job
  await runTokenCleanup(); // run once immediately on startup
  cleanupTimer = setInterval(runTokenCleanup, CLEANUP_INTERVAL_MS);
  logger.info(`✅ Token cleanup job scheduled every ${CLEANUP_INTERVAL_MS / 1000 / 60} minutes`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  if (cleanupTimer) clearInterval(cleanupTimer);
  server.close(() => {
    logger.info("Server shut down gracefully");
    process.exit(0);
  });
});
   