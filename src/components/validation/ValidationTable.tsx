import type { ValidationDataRow } from "../../data/validationData";
import ValidationTableHeader from "./ValidationTableHeader";
import ValidationTableRow from "./ValidationTableRow";

interface ValidationTableProps {
  data: ValidationDataRow[];
  selectedCells: Set<string>;
  onCellClick: (rowId: string, parameter: string) => void;
}

export default function ValidationTable({
  data,
  selectedCells,
  onCellClick,
}: ValidationTableProps) {
  return (
    <>
      <style>{`
        .validation-table-scroll::-webkit-scrollbar {
          height: 10px;
          width: 10px;
        }
        .validation-table-scroll::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 4px;
        }
        .validation-table-scroll::-webkit-scrollbar-thumb {
          background: #474747ff;
          border-radius: 4px;
        }
        .validation-table-scroll::-webkit-scrollbar-thumb:hover {
          background: #5a5a5a;
        }
        .validation-table-scroll {
          scrollbar-width: thin;
          scrollbar-color: #474747ff #1f2937;
        }
      `}</style>
      <div className="flex-1 overflow-auto min-w-0">
        <div className="overflow-x-auto validation-table-scroll">
          <table className="w-full text-sm">
            <ValidationTableHeader />
            <tbody>
              {data.map((row, idx) => (
                <ValidationTableRow
                  key={idx}
                  row={row}
                  selectedCells={selectedCells}
                  onCellClick={onCellClick}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
