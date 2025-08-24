"use client";

import { useEffect, useRef, useState } from "react";

type HistoryItem = {
  id: string; // creationId
  prompts: string[];
  image: string; // base64
  created_at?: string;
};

type ViewHistoryDropdownProps = {
  items: HistoryItem[];
};

export default function ViewHistoryDropdown({
  items,
}: ViewHistoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/30"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        View history
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      {isOpen && (
        <div
          role="menu"
          aria-label="View history menu"
          className="absolute right-0 mt-2 w-96 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none"
        >
          <div className="p-3">
            {items.length === 0 ? (
              <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                No past creations yet.
              </div>
            ) : (
              <ul className="max-h-72 space-y-2 overflow-auto pr-1 text-sm text-gray-800">
                {items.map((it) => (
                  <li
                    key={it.id}
                    className="flex items-center gap-2 rounded-md bg-gray-50 p-2"
                  >
                    <img
                      src={`data:image/png;base64,${it.image}`}
                      alt={it.prompts?.[0] || "Created item"}
                      className="h-10 w-10 rounded object-cover ring-1 ring-black/5"
                    />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-xs text-gray-700">
                        {it.prompts?.join(", ") || "—"}
                      </span>
                      {it.created_at && (
                        <span className="text-[10px] text-gray-400">
                          {new Date(it.created_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
