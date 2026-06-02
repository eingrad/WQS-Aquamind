import { AlertTriangle, CheckCircle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void; // Optional for info-only dialogs
  type?: "danger" | "warning" | "info" | "success";
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  type = "danger",
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getButtonColor = () => {
    switch (type) {
      case "danger":
        return "bg-red-600 hover:bg-red-700";
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700";
      case "info":
        return "bg-blue-600 hover:bg-blue-700";
      case "success":
        return "bg-green-600 hover:bg-green-700";
      default:
        return "bg-red-600 hover:bg-red-700";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "danger":
        return "text-red-500";
      case "warning":
        return "text-yellow-500";
      case "info":
        return "text-blue-500";
      case "success":
        return "text-green-500";
      default:
        return "text-red-500";
    }
  };

  const handleBackdropClick = () => {
    if (onCancel) {
      onCancel();
    } else {
      onConfirm(); // For info dialogs, clicking backdrop also closes
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[1100] backdrop-blur-sm"
        onClick={handleBackdropClick}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[1101] flex items-center justify-center p-4">
        <div className="bg-[#ffffff] border border-slate-200 rounded-lg shadow-2xl max-w-md w-full p-6 animate-scale-in">
          {/* Icon */}
          <div className="flex items-center justify-center mb-4">
            <div className={`p-3 rounded-full bg-slate-100 ${getIconColor()}`}>
              {type === "success" ? (
                <CheckCircle size={32} />
              ) : (
                <AlertTriangle size={32} />
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-slate-800 text-center mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-slate-500 text-center mb-6 whitespace-pre-line">{message}</p>

          {/* Actions */}
          <div className={`flex gap-3 ${onCancel ? "" : "justify-center"}`}>
            {onCancel && (
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-800 rounded-md font-medium transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={onConfirm}
              className={`${onCancel ? "flex-1" : "px-8"} px-4 py-2 ${getButtonColor()} text-slate-800 rounded-md font-medium transition-colors`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
