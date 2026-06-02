import { Triangle } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  lastDataTimestamp?: string | null;
  compact?: boolean;
}

export default function EmptyState({
  title = "No Data Found",
  message,
  icon,
  lastDataTimestamp = null,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "h-full py-8" : "min-h-[600px]"
      }`}
    >
      {/* Icon */}
      <div className={compact ? "mb-3" : "mb-2"}>
        {icon || (
          <div className="relative">
            {/* Triangle outline */}
            <div
              className={`flex items-center justify-center ${
                compact ? "w-16 h-16" : "w-24 h-24"
              }`}
            >
              <Triangle
                className={`text-gray-600 ${compact ? "w-18 h-18" : "w-50 h-50"}`}
                strokeWidth={1.5}
              />
              {/* Teal exclamation mark */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className={`text-blue-600 font-bold ${
                    compact ? "text-3xl mt-2" : "text-5xl mt-3"
                  }`}
                >
                  !
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Title */}
      <h3
        className={`font-semibold text-slate-800 ${
          compact ? "text-base mb-1" : "text-xl mb-2"
        }`}
      >
        {title}
      </h3>

      {/* Message */}
      {message && <p className="text-sm text-slate-500 max-w-xs">{message}</p>}

      {/* Device status - show last data timestamp if available */}
      {lastDataTimestamp && (
        <div className="mt-2 p-4 bg-orange-900/20 border border-orange-600/30 rounded-lg max-w-md mx-auto">
          <div className="flex items-center justify-center gap-2 text-orange-600 text-sm mb-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span className="font-medium">Device Currently Offline</span>
          </div>
          <p className="text-slate-500 text-xs">
            Last data received:{" "}
            {new Date(lastDataTimestamp).toLocaleString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      )}
    </div>
  );
}
