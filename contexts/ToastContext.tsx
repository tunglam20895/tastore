"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
  showSuccess: () => {},
  showError: () => {},
  showInfo: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const showSuccess = useCallback((message: string) => showToast(message, "success"), [showToast]);
  const showError = useCallback((message: string) => showToast(message, "error"), [showToast]);
  const showInfo = useCallback((message: string) => showToast(message, "info"), [showToast]);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo }}>
      {children}
      {/* Toast Container - Góc trên bên phải */}
      <div
        style={{
          position: "fixed",
          top: "1.5rem",
          right: "1.5rem",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => {
          const styles =
            t.type === "success"
              ? {
                  bg: "#f0fdf4",
                  border: "#16a34a",
                  text: "#14532d",
                  iconBg: "#16a34a",
                }
              : t.type === "error"
              ? {
                  bg: "#fef2f2",
                  border: "#dc2626",
                  text: "#7f1d1d",
                  iconBg: "#dc2626",
                }
              : {
                  bg: "#ffffff",
                  border: "#94a3b8",
                  text: "#1e293b",
                  iconBg: "#64748b",
                };

          return (
            <div
              key={t.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "1rem 1.25rem",
                backgroundColor: styles.bg,
                borderLeft: `4px solid ${styles.border}`,
                borderRadius: "0.75rem",
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                minWidth: "300px",
                maxWidth: "400px",
                pointerEvents: "auto",
                animation: "slideInRight 0.3s ease-out",
              }}
            >
              {/* Icon tròn */}
              <span
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: styles.iconBg,
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: "bold",
                  flexShrink: 0,
                }}
              >
                {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "i"}
              </span>
              {/* Message */}
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  lineHeight: 1.4,
                  flex: 1,
                  color: styles.text,
                }}
              >
                {t.message}
              </span>
              {/* Close button */}
              <button
                onClick={() => dismiss(t.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "18px",
                  color: "#94a3b8",
                  padding: 0,
                  lineHeight: 1,
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#475569")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
