import { useState, useRef, useEffect } from "react";
import { DateRange } from "react-date-range";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  fullWidth?: boolean;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  fullWidth = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Convert string dates to Date objects
  const startDateObj = startDate ? new Date(startDate) : new Date();
  const endDateObj = endDate ? new Date(endDate) : new Date();

  const [selectionRange, setSelectionRange] = useState({
    startDate: startDateObj,
    endDate: endDateObj,
    key: "selection",
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (ranges: any) => {
    const { selection } = ranges;
    setSelectionRange(selection);

    // Convert dates to YYYY-MM-DD format
    const startStr = format(selection.startDate, "yyyy-MM-dd");
    const endStr = format(selection.endDate, "yyyy-MM-dd");

    onStartDateChange(startStr);
    onEndDateChange(endStr);
  };

  // Format display text
  const getDisplayText = () => {
    if (!startDate && !endDate) {
      return "Select Date Range";
    }
    if (startDate && !endDate) {
      return format(new Date(startDate), "dd/MM/yyyy") + " - ...";
    }
    if (startDate && endDate) {
      return `${format(new Date(startDate), "dd/MM/yyyy")} - ${format(
        new Date(endDate),
        "dd/MM/yyyy"
      )}`;
    }
    return "Select Date Range";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Input trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="relative cursor-pointer"
      >
        <div
          className={`px-4 py-2.5 pr-10 rounded-lg text-sm border border-white/10 hover:border-teal-500/40 focus:border-teal-500 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/10 bg-transparent ${
            fullWidth
              ? "w-full"
              : startDate && endDate
              ? "min-w-[240px]"
              : "w-[180px]"
          }`}
        >
          <span className={startDate && endDate ? "text-white" : "text-white"}>
            {getDisplayText()}
          </span>
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Calendar className="w-4 h-4 text-teal-400" />
        </div>
      </div>

      {/* Dropdown calendar */}
      {isOpen && (
        <div className="absolute top-full mt-2 z-50 bg-[#1a2a2a] rounded-lg shadow-2xl border border-white/10 overflow-hidden">
          <style>{`
            .rdrCalendarWrapper {
              background: #1a2a2a;
              color: white;
            }
            .rdrDateDisplayWrapper {
              background: #0f1717;
            }
            .rdrMonthAndYearWrapper {
              background: #0f1717;
              padding-top: 10px;
            }
            .rdrMonthPicker select,
            .rdrYearPicker select {
              background: #2a3a3a;
              color: white;
              border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .rdrDayNumber span {
              color: white;
            }
            .rdrDayPassive .rdrDayNumber span {
              color: #666;
            }
            .rdrDay:not(.rdrDayPassive) .rdrInRange ~ .rdrDayNumber span,
            .rdrDay:not(.rdrDayPassive) .rdrStartEdge ~ .rdrDayNumber span,
            .rdrDay:not(.rdrDayPassive) .rdrEndEdge ~ .rdrDayNumber span {
              color: white;
            }
            .rdrDayToday .rdrDayNumber span:after {
              background: #14b8a6;
            }
            .rdrDateDisplay {
              margin: 0;
            }
            .rdrDateDisplayItem {
              background: #2a3a3a;
              border: 1px solid rgba(255, 255, 255, 0.1);
              color: white;
            }
            .rdrDateDisplayItemActive {
              border-color: #14b8a6;
            }
            .rdrMonthAndYearPickers select {
              color: white;
            }
            .rdrNextPrevButton {
              background: #c0c0c0ff;
            }
            .rdrNextPrevButton:hover {
              background: #14b8a6
            }
            .rdrInRange {
              background: rgba(20, 184, 166, 0.2) !important;
            }
            .rdrStartEdge,
            .rdrEndEdge {
              background: #14b8a6 !important;
            }
            .rdrDayStartPreview,
            .rdrDayInPreview,
            .rdrDayEndPreview {
              background: rgba(20, 184, 166, 0.1) !important;
              border-color: rgba(20, 184, 166, 0.3) !important;
            }
          `}</style>
          <DateRange
            ranges={[selectionRange]}
            onChange={handleSelect}
            moveRangeOnFirstSelection={false}
            months={1}
            direction="horizontal"
            rangeColors={["#14b8a6"]}
            dateDisplayFormat="dd/MM/yyyy"
          />
        </div>
      )}
    </div>
  );
}
