"use client";

import { useEffect, type RefObject } from "react";

type DismissiblePopoverOptions = {
  open: boolean;
  onClose: () => void;
  popoverRef: RefObject<HTMLElement | null>;
  triggerRef: RefObject<HTMLElement | null>;
  initialFocusSelector?: string;
};

const defaultFocusSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useDismissiblePopover({
  open,
  onClose,
  popoverRef,
  triggerRef,
  initialFocusSelector = defaultFocusSelector
}: DismissiblePopoverOptions) {
  useEffect(() => {
    if (!open) return;

    const focusFrame = window.requestAnimationFrame(() => {
      popoverRef.current?.querySelector<HTMLElement>(initialFocusSelector)?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      event.preventDefault();
      onClose();
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (popoverRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [initialFocusSelector, onClose, open, popoverRef, triggerRef]);
}
