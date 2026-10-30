interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/** Page numbers with ellipses: 1 … 4 5 6 … 10 */
function pageList(page: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | 'gap')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push('gap');
    result.push(p);
  });
  return result;
}

export function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => onChange(page - 1)} disabled={page <= 1}>
        Previous
      </button>
      {pageList(page, totalPages).map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} className="pagination-gap" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </button>
    </nav>
  );
}
