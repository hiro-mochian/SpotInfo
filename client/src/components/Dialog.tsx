import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useEffect, useRef } from "react";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function Dialog({ open, onOpenChange, title, description, children }: DialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) window.setTimeout(() => closeRef.current?.focus(), 0);
  }, [open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay" />
        <DialogPrimitive.Content className="dialog-content" aria-describedby={description ? undefined : undefined}>
          <div className="dialog-header">
            <div>
              <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
              {description ? <DialogPrimitive.Description>{description}</DialogPrimitive.Description> : null}
            </div>
            <DialogPrimitive.Close ref={closeRef} className="dialog-close" aria-label="閉じる">
              ×
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
