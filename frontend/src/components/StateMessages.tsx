import type { ReactNode } from 'react';

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state state-error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="state state-empty">
      <p className="state-title">{title}</p>
      {description && <p className="muted">{description}</p>}
      {action}
    </div>
  );
}
