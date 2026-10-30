import { useEffect, useId, useRef } from 'react';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  pendingLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Accessible modal confirmation: role="dialog", focus moves to Cancel, Escape closes. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  pendingLabel = 'Deleting...',
  pending = false,
  onConfirm,
  onCancel,
}: Props) {
  const titleId = useId();
  const messageId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pending) onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, pending, onCancel]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={() => !pending && onCancel()}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="modal-title">
          {title}
        </h2>
        <p id={messageId}>{message}</p>
        <div className="modal-actions">
          <button ref={cancelRef} type="button" className="btn btn-secondary" onClick={onCancel} disabled={pending}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={pending} aria-busy={pending}>
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
