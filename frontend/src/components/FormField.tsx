import type { ReactNode } from 'react';

interface Props {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

/**
 * Label + control + hint + error. The control must use the same `id`
 * and should set aria-describedby={describedBy(id, error, hint)}.
 */
export function FormField({ id, label, error, hint, required, children }: Props) {
  return (
    <div className={`field ${error ? 'field-invalid' : ''}`}>
      <label htmlFor={id}>
        {label}
        {required && (
          <span className="required" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function describedBy(id: string, error?: string, hint?: string) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}
