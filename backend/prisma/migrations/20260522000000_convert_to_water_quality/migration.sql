-- AquaMind: Convert air quality parameters to water quality parameters
-- Drops telemetry_raw table, drops gas/met columns, adds water quality columns

-- Drop telemetry_raw (no longer needed — data ingested directly to telemetry_processed)
DROP TABLE IF EXISTS "telemetry_raw" CASCADE;

ALTER TABLE "telemetry_processed"
  -- Remove raw reference (telemetry_raw is gone)
  DROP COLUMN IF EXISTS "raw_id",
  -- Remove air quality gas columns
  DROP COLUMN IF EXISTS "so2_value",
  DROP COLUMN IF EXISTS "h2s_value",
  DROP COLUMN IF EXISTS "no2_value",
  DROP COLUMN IF EXISTS "no_value",
  DROP COLUMN IF EXISTS "nox_value",
  -- Remove BTEX columns
  DROP COLUMN IF EXISTS "benzene_value",
  DROP COLUMN IF EXISTS "toluene_value",
  DROP COLUMN IF EXISTS "ethylbenzene_value",
  DROP COLUMN IF EXISTS "xylenes_value",
  -- Remove meteorological columns not applicable to water monitoring
  DROP COLUMN IF EXISTS "humidity_value",
  DROP COLUMN IF EXISTS "ws_value",
  DROP COLUMN IF EXISTS "wd_value",
  DROP COLUMN IF EXISTS "solar_value",
  DROP COLUMN IF EXISTS "rain_value",
  -- Add water quality columns
  ADD COLUMN IF NOT EXISTS "ph_value"      DECIMAL(5,3),
  ADD COLUMN IF NOT EXISTS "do_value"      DECIMAL(6,3),
  ADD COLUMN IF NOT EXISTS "nh3_n_value"   DECIMAL(8,4),
  ADD COLUMN IF NOT EXISTS "cod_value"     DECIMAL(8,3),
  ADD COLUMN IF NOT EXISTS "bod_value"     DECIMAL(8,3),
  ADD COLUMN IF NOT EXISTS "tss_value"     DECIMAL(8,3),
  ADD COLUMN IF NOT EXISTS "depth_value"   DECIMAL(7,3);
-- temp_value and pressure_value already exist and are kept as-is
