"use client";

import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    [],
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className="pointer-events-auto cursor-pointer bg-white rounded-xl shadow-hover p-4 border-l-4 border-accent-violet flex items-center justify-between gap-3 animate-slide-in transition-all duration-300 hover:translate-x-[-4px]"
            style={{
              borderColor:
                toast.type === "error"
                  ? "#ef4444"
                  : toast.type === "info"
                    ? "#3b82f6"
                    : "#6c63ff",
            }}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-sm">
                {toast.type === "error"
                  ? "❌"
                  : toast.type === "info"
                    ? "ℹ️"
                    : "✨"}
              </span>
              <p className="text-xs font-bold text-navy-text leading-tight">
                {toast.message}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              className="text-[10px] text-muted-text font-bold hover:text-navy-text focus:outline-none px-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
