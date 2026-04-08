"use client";

const LIMIT_OPTIONS = [20, 50, 100, 200, 500];

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export default function Pagination({ page, totalPages, total, limit, onPageChange, onLimitChange }: PaginationProps) {
  if (totalPages <= 1 && !onLimitChange) return null;

  const getPages = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const btnBase = "w-8 h-8 flex items-center justify-center text-xs transition-colors";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-stone-200 gap-3">
      <div className="flex items-center gap-3">
        <span className="text-xs text-stone-500 font-medium">
          Trang {page}/{totalPages || 1} • Tổng {total} kết quả
        </span>
        {onLimitChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-400">Hiển thị</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="text-xs border border-stone-200 rounded px-2 py-1 text-stone-600 focus:outline-none focus:border-espresso bg-white"
            >
              {LIMIT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={`${btnBase} text-stone-500 hover:text-espresso disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          ←
        </button>
        {getPages().map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-stone-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`${btnBase} border rounded ${
                p === page
                  ? "bg-espresso text-cream border-espresso"
                  : "border-stone-300 text-stone-600 hover:border-espresso hover:text-espresso"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className={`${btnBase} text-stone-500 hover:text-espresso disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          →
        </button>
      </div>
    </div>
  );
}
