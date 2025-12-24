"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Icon } from "./Icon";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (type: ToastType, message: string, duration = 5000) => {
      const id = Math.random().toString(36).substr(2, 9);
      const toast: Toast = { id, type, message, duration };

      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({
  toast,
  onClose,
}) => {
  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case "success":
        return "border-green-500/50 bg-green-500/10 text-green-400";
      case "error":
        return "border-red-500/50 bg-red-500/10 text-red-400";
      case "warning":
        return "border-yellow-500/50 bg-yellow-500/10 text-yellow-400";
      case "info":
        return "border-blue-500/50 bg-blue-500/10 text-blue-400";
    }
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return "check_circle";
      case "error":
        return "error";
      case "warning":
        return "warning";
      case "info":
        return "info";
    }
  };

  return (
    <div
      className={`glass-panel p-4 border ${getToastStyles(
        toast.type
      )} animate-slide-up flex items-start gap-3 min-w-[300px] shadow-xl`}
    >
      <Icon name={getIcon(toast.type)} className="flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
      >
        <Icon name="close" className="text-lg" />
      </button>
    </div>
  );
};
