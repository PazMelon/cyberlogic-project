import React, { createContext, useState, useCallback, useRef } from "react";
import { Dialog } from "../components/ui";

export type DialogType = "info" | "success" | "warning" | "error" | "danger";

export interface DialogOptions {
  title: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  isConfirm?: boolean;
}

interface DialogContextProps {
  showAlert: (options: Omit<DialogOptions, "isConfirm">) => void;
  showConfirm: (options: Omit<DialogOptions, "isConfirm">) => Promise<boolean>;
}

export const DialogContext = createContext<DialogContextProps | undefined>(undefined);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogState, setDialogState] = useState<DialogOptions | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const showAlert = useCallback((options: Omit<DialogOptions, "isConfirm">) => {
    setDialogState({
      ...options,
      type: options.type || "info",
      confirmText: options.confirmText || "OK",
      isConfirm: false,
    });
    setIsOpen(true);
  }, []);

  const showConfirm = useCallback((options: Omit<DialogOptions, "isConfirm">) => {
    setDialogState({
      ...options,
      type: options.type || "warning",
      confirmText: options.confirmText || "Confirm",
      cancelText: options.cancelText || "Cancel",
      isConfirm: true,
    });
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  }, []);

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {isOpen && dialogState && (
        <Dialog
          title={dialogState.title}
          message={dialogState.message}
          type={dialogState.type || "info"}
          confirmText={dialogState.confirmText}
          cancelText={dialogState.cancelText}
          isConfirm={dialogState.isConfirm || false}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          onClose={handleClose}
        />
      )}
    </DialogContext.Provider>
  );
}
