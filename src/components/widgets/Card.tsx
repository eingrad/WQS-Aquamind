// src/components/Card.tsx
import React from "react";

export default function Card({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    
    <div className="bg-[#ffffff] border border-slate-200 rounded-2xl">
      <div className="flex justify-between items-center bg-[#ffffff] px-4 sm:px-5 py-3 border-slate-200 border-b">
        <div className="font-medium text-slate-700">{title}</div>
        {right}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}
