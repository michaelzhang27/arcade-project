"use client";

import Image from "next/image";
import ViewHistoryDropdown from "@/components/ViewHistoryDropdown";
import ShoppingCartDropdown from "@/components/ShoppingCartDropdown";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

function generateCreationId() {
  if (typeof crypto !== "undefined" && (crypto as any).randomUUID) {
    return (crypto as any).randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

type CartMap = Record<string, { prompts: string[]; image: string }>; // creationId -> payload

type HistoryItem = {
  id: string;
  prompts: string[];
  image: string;
  created_at?: string;
};

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [responses, setResponses] = useState<
    { kind: "image" | "error"; value: string }[]
  >([]);
  const [chatMode, setChatMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [creationId, setCreationId] = useState<string>(generateCreationId());
  const [lastImageBase64, setLastImageBase64] = useState<string | null>(null);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [cart, setCart] = useState<CartMap>({});
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  // Load history on page load
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:4000/history");
        const data = await res.json();
        const history = data?.history || {};
        const items: HistoryItem[] = Object.entries(history).map(
          ([id, v]: any) => ({
            id,
            prompts: v?.prompts || [],
            image: v?.image || "",
            created_at: v?.created_at,
          })
        );
        setHistoryItems(items);
      } catch {}
    })();
  }, []);

  async function refreshCart() {
    try {
      const res = await fetch("http://localhost:4000/store/cart");
      const data = await res.json();
      setCart(data?.items || {});
    } catch {}
  }

  async function handleSubmit() {
    if (isLoading) return;
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, trimmed]);
    setPromptHistory((prev) => [...prev, trimmed]);
    setInputValue("");
    setChatMode(true);
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:4000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, image: lastImageBase64 }),
      });
      const data = await res.json();
      if (!data?.ok || data?.error) {
        setResponses((prev) => [
          ...prev,
          {
            kind: "error",
            value: String(data?.error || "Failed to generate image"),
          },
        ]);
      } else if (data?.image) {
        setResponses((prev) => [...prev, { kind: "image", value: data.image }]);
        setLastImageBase64(data.image);
      } else {
        setResponses((prev) => [
          ...prev,
          { kind: "error", value: "Unexpected response from server" },
        ]);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Network error";
      setResponses((prev) => [...prev, { kind: "error", value: message }]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddToCart() {
    if (!lastImageBase64) return;
    const prompts = promptHistory.length > 0 ? promptHistory : messages;
    try {
      await fetch("http://localhost:4000/store/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: creationId,
          value: { prompts, image: lastImageBase64 },
        }),
      });
      await refreshCart();
    } catch {}
  }

  async function handleDeleteCartItem(id: string) {
    try {
      await fetch("http://localhost:4000/store/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creation_id: id }),
      });
      await refreshCart();
    } catch {}
  }

  async function handlePurchase() {
    try {
      setPurchaseLoading(true);
      const res = await fetch("http://localhost:4000/store/commit", {
        method: "POST",
      });
      const data = await res.json();
      if (data?.ok) {
        setSuccessMessage("Purchased successfully! It is now in history.");
        // refresh history
        try {
          const hr = await fetch("http://localhost:4000/history");
          const hd = await hr.json();
          const history = hd?.history || {};
          const items: HistoryItem[] = Object.entries(history).map(
            ([id, v]: any) => ({
              id,
              prompts: v?.prompts || [],
              image: v?.image || "",
              created_at: v?.created_at,
            })
          );
          setHistoryItems(items);
        } catch {}
        // refresh cart
        await refreshCart();
      }
    } catch {
    } finally {
      setPurchaseLoading(false);
      // Clear local success after fade (handled in dropdown)
      setTimeout(() => setSuccessMessage(""), 3100);
    }
  }

  async function handleClearCart() {
    try {
      await fetch("http://localhost:4000/store/rollback", { method: "POST" });
      await refreshCart();
    } catch {}
  }

  function handleCreateAnother() {
    setCreationId(generateCreationId());
    setMessages([]);
    setResponses([]);
    setPromptHistory([]);
    setLastImageBase64(null);
    setIsLoading(false);
    setChatMode(false);
    setInputValue("");
    if (messagesRef.current) {
      messagesRef.current.scrollTop = 0;
    }
  }

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, chatMode, isLoading, responses]);

  const cartItems = useMemo(() => {
    return Object.entries(cart).map(([creationId, payload]) => ({
      creationId,
      prompts: (payload as any)?.prompts || [],
      image: (payload as any)?.image || "",
    }));
  }, [cart]);

  return (
    <div className="h-screen overflow-hidden bg-background">
      <header className="sticky top-0 z-50 w-full bg-black text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label="Arcade Home"
          >
            <Image
              src="https://www.arcade.ai/_next/static/media/arcade-full-logo-2.3ba7d54e.svg"
              alt="Arcade"
              width={128}
              height={24}
              priority
            />
          </Link>
          <div className="flex items-center gap-2">
            <ViewHistoryDropdown items={historyItems} />
            <ShoppingCartDropdown
              items={cartItems}
              onDeleteItem={handleDeleteCartItem}
              onPurchase={handlePurchase}
              onClearCart={handleClearCart}
              purchaseLoading={purchaseLoading}
              successMessage={successMessage}
            />
          </div>
        </div>
      </header>

      <main className="relative h-[calc(100vh-64px)]">
        {/* Scrollable chat/messages container */}
        <div
          ref={messagesRef}
          className="absolute inset-0 overflow-auto px-4 pb-32 pt-6 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-3xl">
            {/* User + assistant messages */}
            {messages.length > 0 && (
              <div className="flex flex-col gap-3">
                {messages.map((msg, idx) => (
                  <div key={idx} className="flex flex-col gap-3">
                    <div className="flex justify-end">
                      <div className="max-w-[80%] rounded-2xl bg-black px-4 py-2 text-white shadow">
                        {msg}
                      </div>
                    </div>
                    {(responses[idx] ||
                      (idx === messages.length - 1 && isLoading)) && (
                      <div className="flex justify-start">
                        <div className="w-[300px] max-w-[90%] rounded-2xl bg-gray-100 p-2 text-gray-800 shadow">
                          {isLoading &&
                          idx === messages.length - 1 &&
                          !responses[idx] ? (
                            <div className="flex h-56 w-full items-center justify-center rounded-lg bg-gray-100">
                              <div className="flex items-center justify-center rounded-md p-4 animate-pulse">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="h-10 w-10 text-gray-400"
                                >
                                  <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2ZM8.5 8.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM6 18l3.5-4.5 2.5 3L15.5 13 18 18H6Z" />
                                </svg>
                              </div>
                            </div>
                          ) : responses[idx]?.kind === "image" ? (
                            <img
                              src={`data:image/png;base64,${responses[idx].value}`}
                              alt="Generated image"
                              className="h-auto w-full rounded-md"
                            />
                          ) : (
                            <div className="px-2 py-1 text-black">
                              {responses[idx]?.value}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Animated input container */}
        <div
          className={`absolute left-0 right-0 transition-[top] duration-500 ease-out ${
            chatMode ? "top-[calc(100vh-64px-96px)]" : "top-16 sm:top-20"
          }`}
        >
          <div
            className={`mx-auto px-4 sm:px-6 lg:px-8 transition-[max-width] duration-500 ${
              chatMode ? "max-w-4xl" : "max-w-3xl"
            }`}
          >
            {!chatMode && (
              <h1 className="mb-3 text-2xl font-semibold tracking-tight text-foreground">
                Create Custom Products with AI
              </h1>
            )}
            <div className="flex items-center gap-3">
              <div className="flex flex-1 items-stretch gap-2 rounded-2xl border border-black/10 bg-white p-2 shadow-sm">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="Generate a keychain of sonic the hedgehog..."
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  suppressHydrationWarning
                />
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-white ${
                    isLoading
                      ? "cursor-not-allowed bg-black/60"
                      : "bg-black hover:bg-black/90"
                  }`}
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/60 border-t-white" />
                      Generating
                    </span>
                  ) : (
                    "Generate"
                  )}
                </button>
              </div>
              {chatMode && (
                <>
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!lastImageBase64}
                    className={`inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium ${
                      lastImageBase64
                        ? "border-black text-black hover:bg-black/5"
                        : "cursor-not-allowed border-black/20 text-black/40"
                    }`}
                  >
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateAnother}
                    disabled={isLoading}
                    className={`inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium ${
                      isLoading
                        ? "cursor-not-allowed border-black/30 text-black/60"
                        : "border-black text-black hover:bg-black/5"
                    }`}
                  >
                    Create Another
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
