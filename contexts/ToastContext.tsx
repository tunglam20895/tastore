"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ToastType = "error" | "success";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 px-4 py-3 shadow-lg min-w-[260px] max-w-sm pointer-events-auto animate-in slide-in-from-right-4 duration-300 ${
              t.type === "error"
                ? "bg-espresso text-cream"
                : "bg-green-700 text-white"
            }`}
          >
            <span className="text-sm leading-snug flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="text-lg leading-none opacity-60 hover:opacity-100 shrink-0 mt-0.5"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
