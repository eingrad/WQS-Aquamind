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
          className={`px-4 py-2.5 pr-10 rounded-lg text-sm border border-slate-200 hover:border-blue-500/40 focus:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 bg-transparent ${
            fullWidth
              ? "w-full"
              : startDate && endDate
              ? "min-w-[240px]"
              : "w-[180px]"
          }`}
        >
          <span className={startDate && endDate ? "text-slate-800" : "text-slate-800"}>
            {getDisplayText()}
          </span>
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Calendar className="w-4 h-4 text-blue-600" />
        </div>
      </div>

      {/* Dropdown calendar */}
      {isOpen && (
        <div className="absolute top-full mt-2 z-50 bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden">
          <style>{`
            .rdrCalendarWrapper {
              background: #ffffff;
              color: #1e293b;
            }
            .rdrDateDisplayWrapper {
              background: #f8fafc;
            }
            .rdrMonthAndYearWrapper {
              background: #ffffff;
              padding-top: 10px;
            }
            .rdrMonthPicker select,
            .rdrYearPicker select {
              background: #f1f5f9;
              color: #1e293b;
              border: 1px solid #e2e8f0;
            }
            .rdrWeekDay {
              color: #64748b;
            }
            .rdrMonthName {
              color: #475569;
            }
            .rdrDayNumber span {
              color: #334155;
            }
            .rdrDayPassive .rdrDayNumber span {
              color: #cbd5e1;
            }
            .rdrDay:not(.rdrDayPassive) .rdrInRange ~ .rdrDayNumber span,
            .rdrDay:not(.rdrDayPassive) .rdrStartEdge ~ .rdrDayNumber span,
            .rdrDay:not(.rdrDayPassive) .rdrEndEdge ~ .rdrDayNumber span {
              color: #ffffff;
            }
            .rdrDayToday .rdrDayNumber span:after {
              background: #2563eb;
            }
            .rdrDateDisplay {
              margin: 0;
            }
            .rdrDateDisplayItem {
              background: #ffffff;
              border: 1px solid #e2e8f0;
              box-shadow: none;
            }
            .rdrDateDisplayItem input {
              color: #1e293b;
            }
            .rdrDateDisplayItemActive {
              border-color: #2563eb;
            }
            .rdrMonthAndYearPickers select {
              color: #1e293b;
            }
            .rdrNextPrevButton {
              background: #f1f5f9;
            }
            .rdrNextPrevButton:hover {
              background: #e2e8f0;
            }
            .rdrInRange {
              background: rgba(37, 99, 235, 0.2) !important;
            }
            .rdrStartEdge,
            .rdrEndEdge {
              background: #2563eb !important;
            }
            .rdrDayStartPreview,
            .rdrDayInPreview,
            .rdrDayEndPreview {
              background: rgba(37, 99, 235, 0.1) !important;
              border-color: rgba(37, 99, 235, 0.3) !important;
            }
          `}</style>
          <DateRange
            ranges={[selectionRange]}
            onChange={handleSelect}
            moveRangeOnFirstSelection={false}
            months={1}
            direction="horizontal"
            rangeColors={["#2563eb"]}
            dateDisplayFormat="dd/MM/yyyy"
          />
        </div>
      )}
    </div>
  );
}
