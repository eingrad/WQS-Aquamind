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
    
    <div className="bg-[#111a1a] border border-white/5 rounded-2xl">
      <div className="flex justify-between items-center bg-[#0f1717] px-4 sm:px-5 py-3 border-white/5 border-b">
        <div className="font-medium text-gray-100">{title}</div>
        {right}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}
