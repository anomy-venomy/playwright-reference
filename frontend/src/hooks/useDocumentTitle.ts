import { useEffect } from 'react';

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} | WorkFlow Manager` : 'WorkFlow Manager';
  }, [title]);
}
