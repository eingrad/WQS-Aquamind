import { PARAMETER_DB_MAP } from "../queries/parameter-mapping";
import { getDataQualityThresholds } from "./data-quality";

/**
 * Build aggregation columns for SQL query (for regular or moving average queries)
 */
export const buildAggregationColumns = (
  paramList: string[],
  isMovingAvg: boolean
): string => {
  return paramList
    .filter((p) => PARAMETER_DB_MAP[p])
    .map((p) => {
      const col = PARAMETER_DB_MAP[p];

      // Special handling for wind direction (vector mean) - convert to 0-360° range
      if (p === "windDirection") {
        if (isMovingAvg) {
          return `
            MOD((DEGREES(ATAN2(
              AVG(SIN(RADIANS(tp.${col}))) OVER (ORDER BY tb.bucket ROWS BETWEEN 7 PRECEDING AND CURRENT ROW),
              AVG(COS(RADIANS(tp.${col}))) OVER (ORDER BY tb.bucket ROWS BETWEEN 7 PRECEDING AND CURRENT ROW)
            )) + 360)::numeric, 360) as ${p}_avg,
            MIN(tp.${col}) OVER (ORDER BY tb.bucket ROWS BETWEEN 7 PRECEDING AND CURRENT ROW) as ${p}_min,
            MAX(tp.${col}) OVER (ORDER BY tb.bucket ROWS BETWEEN 7 PRECEDING AND CURRENT ROW) as ${p}_max
          `;
        } else {
          return `
            MOD((DEGREES(ATAN2(
              AVG(SIN(RADIANS(tp.${col}))),
              AVG(COS(RADIANS(tp.${col})))
            )) + 360)::numeric, 360) as ${p}_avg,
            MIN(tp.${col}) as ${p}_min,
            MAX(tp.${col}) as ${p}_max
          `;
        }
      }

      // Regular arithmetic mean for other parameters
      if (isMovingAvg) {
        return `
          AVG(tp.${col}) OVER (ORDER BY tb.bucket ROWS BETWEEN 7 PRECEDING AND CURRENT ROW) as ${p}_avg,
          MIN(tp.${col}) OVER (ORDER BY tb.bucket ROWS BETWEEN 7 PRECEDING AND CURRENT ROW) as ${p}_min,
          MAX(tp.${col}) OVER (ORDER BY tb.bucket ROWS BETWEEN 7 PRECEDING AND CURRENT ROW) as ${p}_max
        `;
      } else {
        return `
          AVG(tp.${col}) as ${p}_avg,
          MIN(tp.${col}) as ${p}_min,
          MAX(tp.${col}) as ${p}_max
        `;
      }
    })
    .join(",");
};

/**
 * Build base aggregation columns (without window functions) for moving averages
 */
export const buildBaseAggregationColumns = (paramList: string[]): string => {
  return paramList
    .filter((p) => PARAMETER_DB_MAP[p])
    .map((p) => {
      const col = PARAMETER_DB_MAP[p];
      if (p === "windDirection") {
        return `
          MOD((DEGREES(ATAN2(
            AVG(SIN(RADIANS(tp.${col}))),
            AVG(COS(RADIANS(tp.${col})))
          )) + 360)::numeric, 360) as ${p}_base_avg,
          MIN(tp.${col}) as ${p}_base_min,
          MAX(tp.${col}) as ${p}_base_max
        `;
      } else {
        return `
          AVG(tp.${col}) as ${p}_base_avg,
          MIN(tp.${col}) as ${p}_base_min,
          MAX(tp.${col}) as ${p}_base_max
        `;
      }
    })
    .join(",");
};

/**
 * Build moving average columns from base aggregation
 */
export const buildMovingAverageColumns = (paramList: string[]): string => {
  return paramList
    .filter((p) => PARAMETER_DB_MAP[p])
    .map((p) => {
      return `
        AVG(${p}_base_avg) OVER (ORDER BY bucket DESC ROWS BETWEEN 7 PRECEDING AND CURRENT ROW) as ${p}_avg,
        MIN(${p}_base_min) OVER (ORDER BY bucket DESC ROWS BETWEEN 7 PRECEDING AND CURRENT ROW) as ${p}_min,
        MAX(${p}_base_max) OVER (ORDER BY bucket DESC ROWS BETWEEN 7 PRECEDING AND CURRENT ROW) as ${p}_max
      `;
    })
    .join(",");
};

/**
 * Build complete regular aggregation query
 */
export const buildRegularAggregationQuery = (options: {
  deviceId: string;
  startDate: Date;
  endDate: Date;
  interval: string;
  paramList: string[];
}): string => {
  const { deviceId, startDate, endDate, interval, paramList } = options;
  const thresholds = getDataQualityThresholds(interval);
  // Fallback if thresholds is null
  const requiredPoints = thresholds?.required ?? 60;
  const expectedPoints = thresholds?.expected ?? 60;
  const aggregationColumns = buildAggregationColumns(paramList, false);

  return `
    WITH time_buckets AS (
      SELECT time_bucket('${interval}', tp.observed_at) as bucket
      FROM telemetry_processed tp
      WHERE tp.device_id = '${deviceId}'
        AND tp.observed_at >= '${startDate.toISOString()}'
        AND tp.observed_at < '${endDate.toISOString()}'
      GROUP BY bucket
    )
    SELECT
      tb.bucket,
      ${aggregationColumns},
      COUNT(*) as count,
      ROUND((COUNT(*)::decimal / ${requiredPoints}) * 100, 1) as data_availability_pct,
      CASE
        WHEN COUNT(*) >= ${expectedPoints} THEN 'complete'
        WHEN COUNT(*) >= ${Math.ceil(requiredPoints * 0.5)} THEN 'partial'
        ELSE 'insufficient'
      END as data_quality
    FROM time_buckets tb
    LEFT JOIN telemetry_processed tp
      ON time_bucket('${interval}', tp.observed_at) = tb.bucket
      AND tp.device_id = '${deviceId}'
      AND tp.observed_at >= '${startDate.toISOString()}'
      AND tp.observed_at < '${endDate.toISOString()}'
    GROUP BY tb.bucket
    ORDER BY tb.bucket DESC
  `;
};

/**
 * Build complete moving average query
 */
export const buildMovingAverageQuery = (options: {
  deviceId: string;
  startDate: Date;
  endDate: Date;
  interval: string;
  paramList: string[];
}): string => {
  const { deviceId, startDate, endDate, interval, paramList } = options;
  const thresholds = getDataQualityThresholds(interval);
  // Fallback if thresholds is null
  const requiredPoints = thresholds?.required ?? 60;
  const expectedPoints = thresholds?.expected ?? 60;
  const baseAggColumns = buildBaseAggregationColumns(paramList);
  const movingAvgColumns = buildMovingAverageColumns(paramList);

  return `
    WITH time_buckets AS (
      SELECT time_bucket('${interval}', tp.observed_at) as bucket
      FROM telemetry_processed tp
      WHERE tp.device_id = '${deviceId}'
        AND tp.observed_at >= '${startDate.toISOString()}'
        AND tp.observed_at < '${endDate.toISOString()}'
      GROUP BY bucket
    ),
    base_aggregation AS (
      SELECT
        tb.bucket,
        ${baseAggColumns},
        COUNT(*) as count,
        ROUND((COUNT(*)::decimal / ${requiredPoints}) * 100, 1) as data_availability_pct,
        CASE
          WHEN COUNT(*) >= ${expectedPoints} THEN 'complete'
          WHEN COUNT(*) >= ${Math.ceil(requiredPoints * 0.5)} THEN 'partial'
          ELSE 'insufficient'
        END as data_quality
      FROM time_buckets tb
      LEFT JOIN telemetry_processed tp
        ON time_bucket('${interval}', tp.observed_at) = tb.bucket
        AND tp.device_id = '${deviceId}'
        AND tp.observed_at >= '${startDate.toISOString()}'
        AND tp.observed_at < '${endDate.toISOString()}'
      GROUP BY tb.bucket
    )
    SELECT
      bucket,
      ${movingAvgColumns},
      count,
      data_availability_pct,
      data_quality
    FROM base_aggregation
    ORDER BY bucket DESC
  `;
};
