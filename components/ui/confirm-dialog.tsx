"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "./button";
import { cn } from "@/lib/utils";

/**
 * Confirmation modal for destructive actions.
 *
 * Built on `<dialog>`'s behaviour by hand rather than the element itself,
 * because `showModal()` needs an effect to stay in sync with React state and
 * the native backdrop can't be styled with our tokens.
 *
 * Handles focus-trapping the two buttons, Escape to cancel, restoring focus to
 * whatever opened it, and locking body scroll.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  destructive = true,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const confirmRef = React.useRef<HTMLButtonElement>(null);
  const restoreRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!open) return;

    restoreRef.current = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key !== "Tab") return;
      // Keep focus inside the dialog.
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled])",
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      restoreRef.current?.focus?.();
    };
  }, [open, onCancel]);

  // `open` only becomes true from a user interaction, so there's no server
  // render to guard against beyond the document check itself.
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px]" aria-hidden="true" />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={description ? "confirm-desc" : undefined}
        className={cn(
          "relative w-full max-w-md rounded-lg bg-card p-6 shadow-xl",
          "motion-safe:animate-[confirm-in_140ms_ease-out]",
        )}
      >
        <h2 id="confirm-title" className="text-base font-semibold text-foreground">
          {title}
        </h2>
        {description ? (
          <div id="confirm-desc" className="mt-2 text-sm text-muted">
            {description}
          </div>
        ) : null}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            variant={destructive ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Wires a confirm dialog to an async action.
 *
 *   const del = useConfirm(() => deleteTransaction(id));
 *   <Button onClick={del.ask}>Delete</Button>
 *   <ConfirmDialog {...del.dialogProps} title="Delete this transaction?" />
 */
export function useConfirm(action: () => void | Promise<unknown>) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const onConfirm = React.useCallback(async () => {
    setLoading(true);
    try {
      await action();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, [action]);

  const onCancel = React.useCallback(() => setOpen(false), []);

  return {
    ask: () => setOpen(true),
    dialogProps: { open, loading, onConfirm, onCancel },
  };
}
