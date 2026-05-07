import { PARAMETER_DB_MAP } from "../queries/parameter-mapping";
import { getDataQualityThresholds } from "./data-quality";

/**
 * Build aggregation columns for SQL query (for regular or moving average queries)
 */
export const buildAggregationColumns = (
  paramList: string[],
  isMovingAvg: boolean,
): string => {
  return paramList
    .filter((p) => PARAMETER_DB_MAP[p])
    .map((p) => {
      const col = PARAMETER_DB_MAP[p];

      // Per-parameter reading count (non-null values in the bucket).
      // Used downstream to compute per-parameter availability % against
      // the parameter's native cadence (BTEX: 4/hour, others: 60/hour).
      const countCol = `COUNT(tp.${col}) as ${p}_count`;

      // Special handling for wind direction (vector mean) - convert to 0-360° range
      if (p === "windDirection") {
        if (isMovingAvg) {
          return `
            MOD((DEGREES(ATAN2(
              AVG(SIN(RADIANS(tp.${col}))) OVER (ORDER BY tb.bucket ROWS BETWEEN 7 PRECEDING AND CURRENT ROW),
              AVG(COS(RADIANS(tp.${col}))) OVER (ORDER BY tb.bucket ROWS BETWEEN 7 PRECEDING AND CURRENT ROW)
            )) + 360)::numeric, 360) as ${p}_avg,
            MIN(tp.${col}) OVER (ORDER BY tb.bucket ROWS BETWEEN 7 PRECEDING AND CURRENT ROW) as ${p}_min,
            MAX(tp.${col}) OVER (ORDER BY tb.bucket ROWS BETWEEN 7 PRECEDING AND CURRENT ROW) as ${p}_max,
            ${countCol}
          `;
        } else {
          return `
            MOD((DEGREES(ATAN2(
              AVG(SIN(RADIANS(tp.${col}))),
              AVG(COS(RADIANS(tp.${col})))
            )) + 360)::numeric, 360) as ${p}_avg,
            MIN(tp.${col}) as ${p}_min,
            MAX(tp.${col}) as ${p}_max,
            ${countCol}
          `;
        }
      }

      // Rain is an incremental quantity (mm fallen during each reading
      // interval), so the bucket value must be SUM not AVG. The _avg
      // alias is kept for downstream compatibility — it now carries the
      // total mm in that bucket. min/max stay as the per-reading extremes.
      if (p === "rain") {
        if (isMovingAvg) {
          return `
            SUM(tp.${col}) OVER (ORDER BY tb.bucket ROWS BETWEEN 7 PRECEDING AND CURRENT ROW) as ${p}_avg,
            MIN(tp.${col}) OVER (ORDER BY tb.bucket ROWS BETWEEN 7 PRECEDING AND CURRENT ROW) as ${p}_min,
            MAX(tp.${col}) OVER (ORDER BY tb.bucket ROWS BETWEEN 7 PRECEDING AND CURRENT ROW) as ${p}_max,
            ${countCol}
          `;
        } else {
          return `
            SUM(tp.${col}) as ${p}_avg,
            MIN(tp.${col}) as ${p}_min,
            MAX(tp.${col}) as ${p}_max,
            ${countCol}
          `;
        }
      }

      // Regular arithmetic mean for other parameters
      if (isMovingAvg) {
        return `
          AVG(tp.${col}) OVER (ORDER BY tb.bucket ROWS BETWEEN 7 PRECEDING AND CURRENT ROW) as ${p}_avg,
          MIN(tp.${col}) OVER (ORDER BY tb.bucket ROWS BETWEEN 7 PRECEDING AND CURRENT ROW) as ${p}_min,
          MAX(tp.${col}) OVER (ORDER BY tb.bucket ROWS BETWEEN 7 PRECEDING AND CURRENT ROW) as ${p}_max,
          ${countCol}
        `;
      } else {
        return `
          AVG(tp.${col}) as ${p}_avg,
          MIN(tp.${col}) as ${p}_min,
          MAX(tp.${col}) as ${p}_max,
          ${countCol}
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
      // Per-parameter reading count for the base bucket (not windowed).
      const countCol = `COUNT(tp.${col}) as ${p}_base_count`;

      if (p === "windDirection") {
        return `
          MOD((DEGREES(ATAN2(
            AVG(SIN(RADIANS(tp.${col}))),
            AVG(COS(RADIANS(tp.${col})))
          )) + 360)::numeric, 360) as ${p}_base_avg,
          MIN(tp.${col}) as ${p}_base_min,
          MAX(tp.${col}) as ${p}_base_max,
          ${countCol}
        `;
      } else if (p === "rain") {
        // Incremental quantity — bucket total is SUM, not AVG.
        return `
          SUM(tp.${col}) as ${p}_base_avg,
          MIN(tp.${col}) as ${p}_base_min,
          MAX(tp.${col}) as ${p}_base_max,
          ${countCol}
        `;
      } else {
        return `
          AVG(tp.${col}) as ${p}_base_avg,
          MIN(tp.${col}) as ${p}_base_min,
          MAX(tp.${col}) as ${p}_base_max,
          ${countCol}
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
        MAX(${p}_base_max) OVER (ORDER BY bucket DESC ROWS BETWEEN 7 PRECEDING AND CURRENT ROW) as ${p}_max,
        ${p}_base_count as ${p}_count
      `;
    })
    .join(",");
};

/**
 * Build complete regular aggregation query
 * Returns { query, params } for use with $queryRawUnsafe parameterized binding
 * Params: $1=deviceId, $2=startDate, $3=endDate, $4=interval
 */
export const buildRegularAggregationQuery = (options: {
  deviceId: string;
  startDate: Date;
  endDate: Date;
  interval: string;
  paramList: string[];
}): { query: string; params: any[] } => {
  const { deviceId, startDate, endDate, interval, paramList } = options;
  const thresholds = getDataQualityThresholds(interval);
  // Fallback if thresholds is null
  const requiredPoints = thresholds?.required ?? 60;
  const expectedPoints = thresholds?.expected ?? 60;
  const aggregationColumns = buildAggregationColumns(paramList, false);

  // For daily aggregations (1d interval), use Malaysia timezone to ensure
  // day boundaries match local time rather than UTC
  // This fixes inconsistency between daily and weekly reports
  const timeBucketExpression =
    interval === "1d"
      ? `time_bucket($4::interval, tp.observed_at::timestamptz AT TIME ZONE 'Asia/Kuala_Lumpur')`
      : `time_bucket($4::interval, tp.observed_at)`;

  const query = `
    WITH time_buckets AS (
      SELECT ${timeBucketExpression} as bucket
      FROM telemetry_processed tp
      WHERE tp.device_id = $1::uuid
        AND tp.observed_at >= $2::timestamptz
        AND tp.observed_at < $3::timestamptz
      GROUP BY bucket
    )
    SELECT
      tb.bucket,
      ${aggregationColumns},
      COUNT(*) as count,
      COUNT(*) FILTER (
        WHERE EXISTS (
          SELECT 1 FROM maintenance_log m
          WHERE m.device_id = tp.device_id
            AND m.deleted_at IS NULL
            AND tp.observed_at >= m.start_time
            AND tp.observed_at <= m.end_time
        )
      ) as maintenance_minutes,
      ROUND((COUNT(*)::decimal / ${expectedPoints}) * 100, 1) as data_availability_pct,
      CASE
        WHEN COUNT(*) >= ${expectedPoints} THEN 'complete'
        WHEN COUNT(*) >= ${Math.ceil(requiredPoints * 0.5)} THEN 'partial'
        ELSE 'insufficient'
      END as data_quality
    FROM time_buckets tb
    LEFT JOIN telemetry_processed tp
      ON ${timeBucketExpression} = tb.bucket
      AND tp.device_id = $1::uuid
      AND tp.observed_at >= $2::timestamptz
      AND tp.observed_at < $3::timestamptz
    GROUP BY tb.bucket
    ORDER BY tb.bucket DESC
  `;

  return {
    query,
    params: [deviceId, startDate.toISOString(), endDate.toISOString(), interval],
  };
};

/**
 * Build complete moving average query
 * Returns { query, params } for use with $queryRawUnsafe parameterized binding
 * Params: $1=deviceId, $2=startDate, $3=endDate, $4=interval
 */
export const buildMovingAverageQuery = (options: {
  deviceId: string;
  startDate: Date;
  endDate: Date;
  interval: string;
  paramList: string[];
}): { query: string; params: any[] } => {
  const { deviceId, startDate, endDate, interval, paramList } = options;
  const thresholds = getDataQualityThresholds(interval);
  // Fallback if thresholds is null
  const requiredPoints = thresholds?.required ?? 60;
  const expectedPoints = thresholds?.expected ?? 60;
  const baseAggColumns = buildBaseAggregationColumns(paramList);
  const movingAvgColumns = buildMovingAverageColumns(paramList);

  // Apply same timezone logic for 1d aggregations
  const timeBucketExpression =
    interval === "1d"
      ? `time_bucket($4::interval, tp.observed_at::timestamptz AT TIME ZONE 'Asia/Kuala_Lumpur')`
      : `time_bucket($4::interval, tp.observed_at)`;

  const query = `
    WITH time_buckets AS (
      SELECT ${timeBucketExpression} as bucket
      FROM telemetry_processed tp
      WHERE tp.device_id = $1::uuid
        AND tp.observed_at >= $2::timestamptz
        AND tp.observed_at < $3::timestamptz
      GROUP BY bucket
    ),
    base_aggregation AS (
      SELECT
        tb.bucket,
        ${baseAggColumns},
        COUNT(*) as count,
        COUNT(*) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM maintenance_log m
            WHERE m.device_id = tp.device_id
              AND m.deleted_at IS NULL
              AND tp.observed_at >= m.start_time
              AND tp.observed_at <= m.end_time
          )
        ) as maintenance_minutes,
        ROUND((COUNT(*)::decimal / ${expectedPoints}) * 100, 1) as data_availability_pct,
        CASE
          WHEN COUNT(*) >= ${expectedPoints} THEN 'complete'
          WHEN COUNT(*) >= ${Math.ceil(requiredPoints * 0.5)} THEN 'partial'
          ELSE 'insufficient'
        END as data_quality
      FROM time_buckets tb
      LEFT JOIN telemetry_processed tp
        ON ${timeBucketExpression} = tb.bucket
        AND tp.device_id = $1::uuid
        AND tp.observed_at >= $2::timestamptz
        AND tp.observed_at < $3::timestamptz
      GROUP BY tb.bucket
    )
    SELECT
      bucket,
      ${movingAvgColumns},
      count,
      maintenance_minutes,
      data_availability_pct,
      data_quality
    FROM base_aggregation
    ORDER BY bucket DESC
  `;

  return {
    query,
    params: [deviceId, startDate.toISOString(), endDate.toISOString(), interval],
  };
};
