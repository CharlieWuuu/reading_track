"use client";

import { BookViewMode, useBookViewStore } from "@/store/useBookViewStore";

const OPTIONS: Array<{ id: BookViewMode; label: string; Icon: () => React.ReactElement }> = [
  {
    id: "table",
    label: "表格",
    Icon: () => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M2 4h12M2 8h12M2 12h12" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "card",
    label: "書封",
    Icon: () => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="2" y="2.5" width="5" height="5" rx="1" />
        <rect x="9" y="2.5" width="5" height="5" rx="1" />
        <rect x="2" y="8.5" width="5" height="5" rx="1" />
        <rect x="9" y="8.5" width="5" height="5" rx="1" />
      </svg>
    ),
  },
];

/** 檢視切換：放在頁首那一列，不再另外佔一整行 */
export function BookViewToggle() {
  const { view, setView } = useBookViewStore();

  return (
    <div className="inline-flex rounded border border-gray-300 p-0.5">
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          onClick={() => setView(option.id)}
          aria-pressed={view === option.id}
          aria-label={option.label}
          title={option.label}
          className={`rounded p-1.5 ${
            view === option.id ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-900"
          }`}
        >
          <option.Icon />
        </button>
      ))}
    </div>
  );
}
