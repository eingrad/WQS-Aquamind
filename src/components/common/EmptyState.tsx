import { Triangle } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  lastDataTimestamp?: string | null;
}

export default function EmptyState({
  title = "No Data Found",
  icon,
  lastDataTimestamp = null,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] text-center">
      {/* Icon */}
      <div className="mb-2">
        {icon || (
          <div className="relative">
            {/* Triangle outline */}
            <div className="w-24 h-24 flex items-center justify-center">
              <Triangle className="w-50 h-50 text-gray-600" strokeWidth={1.5} />
              {/* Teal exclamation mark */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-teal-400 text-5xl font-bold mt-2">!</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>

      {/* Device status - show last data timestamp if available */}
      {lastDataTimestamp && (
        <div className="mt-2 p-4 bg-orange-900/20 border border-orange-600/30 rounded-lg max-w-md mx-auto">
          <div className="flex items-center justify-center gap-2 text-orange-400 text-sm mb-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <span className="font-medium">Device Currently Offline</span>
          </div>
          <p className="text-gray-400 text-xs">
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
