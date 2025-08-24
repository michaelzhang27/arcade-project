"use client";

import { useEffect, useRef, useState } from "react";

type CartItem = {
  creationId: string;
  prompts: string[];
  image: string; // base64
};

type ShoppingCartDropdownProps = {
  items: CartItem[];
  onDeleteItem: (creationId: string) => void;
  onPurchase: () => void;
  onClearCart: () => void;
  purchaseLoading?: boolean;
  successMessage?: string;
};

export default function ShoppingCartDropdown({
  items,
  onDeleteItem,
  onPurchase,
  onClearCart,
  purchaseLoading = false,
  successMessage = "",
}: ShoppingCartDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
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

  // Fade in/out success message when it changes
  useEffect(() => {
    if (successMessage) {
      setShowSuccess(true);
      const t = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(t);
    } else {
      setShowSuccess(false);
    }
  }, [successMessage]);

  const hasItems = items.length > 0;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/30"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Shopping Cart"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 12.39a2 2 0 0 0 2 1.61h7.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        {hasItems && (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
            {items.length}
          </span>
        )}
      </button>
      {isOpen && (
        <div
          role="menu"
          aria-label="Shopping cart menu"
          className="absolute right-0 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none"
        >
          <div className="p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Cart</h3>
              <span className="text-xs text-gray-500">
                {items.length} item{items.length === 1 ? "" : "s"}
              </span>
            </div>

            {/* Success notice */}
            <div
              className={`mb-2 overflow-hidden transition-opacity duration-500 ${
                showSuccess ? "opacity-100" : "opacity-0"
              }`}
              aria-live="polite"
            >
              {successMessage && (
                <div className="rounded-md bg-green-50 px-3 py-2 text-xs text-green-700 ring-1 ring-green-600/20">
                  {successMessage}
                </div>
              )}
            </div>

            {!hasItems ? (
              <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                Generate and add an item to cart to check out!
              </div>
            ) : (
              <ul className="mb-3 max-h-56 space-y-2 overflow-auto pr-1 text-sm text-gray-800">
                {items.map((it) => (
                  <li
                    key={it.creationId}
                    className="flex items-center justify-between gap-2 rounded-md bg-gray-50 p-2"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={`data:image/png;base64,${it.image}`}
                        alt={it.prompts?.[0] || "Generated item"}
                        className="h-10 w-10 rounded object-cover ring-1 ring-black/5"
                      />
                      <span className="line-clamp-2 max-w-[140px] text-xs text-gray-700">
                        {it.prompts?.join(", ") || "—"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteItem(it.creationId)}
                      className="inline-flex items-center justify-center rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      aria-label="Remove item"
                      title="Remove"
                      disabled={purchaseLoading}
                    >
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
                      >
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                        <path d="M10 11v6"></path>
                        <path d="M14 11v6"></path>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={onPurchase}
                disabled={!hasItems || purchaseLoading}
                className={`inline-flex w-full items-center justify-center rounded-md px-3 py-2 text-sm font-medium ${
                  hasItems && !purchaseLoading
                    ? "bg-black text-white hover:bg-black/90"
                    : "cursor-not-allowed bg-gray-200 text-gray-500"
                }`}
              >
                {purchaseLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/60 border-t-white" />
                    Purchasing...
                  </span>
                ) : (
                  "Purchase"
                )}
              </button>
              <button
                type="button"
                onClick={onClearCart}
                disabled={!hasItems || purchaseLoading}
                className={`inline-flex w-full items-center justify-center rounded-md border px-3 py-2 text-sm font-medium ${
                  hasItems && !purchaseLoading
                    ? "border-black text-black hover:bg-black/5"
                    : "cursor-not-allowed border-black/20 text-black/40"
                }`}
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
