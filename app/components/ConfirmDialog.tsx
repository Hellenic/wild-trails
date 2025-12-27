import React from "react";
import { Button } from "./ui";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmColor?: "red" | "primary";
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  confirmColor = "primary",
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in">
        <h3 className="text-xl font-serif font-bold text-forest-deep mb-3">
          {title}
        </h3>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="text-gray-700 hover:bg-gray-100"
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmColor === "red" ? "outline" : "primary"}
            onClick={onConfirm}
            className={confirmColor === "red" ? "text-red-600 border-red-600 hover:bg-red-50" : ""}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
