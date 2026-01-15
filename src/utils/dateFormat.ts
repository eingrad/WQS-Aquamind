/**
 * Date/Time Formatting Utilities
 * Consistent date and time formatting across the application
 */

/**
 * Safely parse date string and return formatted date + time string
 * @param dateString - Date string or Date object
 * @returns Formatted string like "14:30, 12/01/26" or original string if invalid
 */
export const formatDateTime = (dateString: string | Date): string => {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return String(dateString);
  }

  const dateStr = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

  const timeStr = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${timeStr}, ${dateStr}`;
};

/**
 * Format date only
 * @param dateString - Date string or Date object
 * @returns Formatted date like "12/01/2026" or "–" if invalid
 */
export const formatDate = (dateString: string | Date): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "–";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Format time only
 * @param dateString - Date string or Date object
 * @returns Formatted time like "14:30" or "–" if invalid
 */
export const formatTime = (dateString: string | Date): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "–";

  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

/**
 * Check if date is valid
 * @param dateString - Date string or Date object
 * @returns true if valid date, false otherwise
 */
export const isValidDate = (dateString: string | Date): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Format date for chart tooltips (used in LineSensorChart)
 * @param dateString - Date string or Date object
 * @returns Formatted string like "14:30, 12/01/26"
 */
export const formatChartTooltipDate = (dateString: string | Date): string => {
  return formatDateTime(dateString);
};

/**
 * Format date for chart X-axis (time only)
 * @param dateString - Date string or Date object
 * @returns Formatted time like "14:30"
 */
export const formatChartAxisTime = (dateString: string | Date): string => {
  return formatTime(dateString);
};
