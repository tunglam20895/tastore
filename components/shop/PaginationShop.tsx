"use client";

interface PaginationShopProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function PaginationShop({ page, totalPages, onPageChange }: PaginationShopProps) {
  if (totalPages <= 1) return null;

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

  return (
    <div className="flex items-center justify-center gap-2 mt-16">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="text-xs uppercase tracking-widest text-stone hover:text-espresso transition-colors disabled:opacity-30 disabled:cursor-not-allowed px-2"
      >
        ← Trang trước
      </button>

      <div className="flex items-center gap-1">
        {getPages().map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-xs text-stone/40">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`w-9 h-9 flex items-center justify-center text-xs transition-colors rounded-full ${
                p === page
                  ? "bg-espresso text-cream"
                  : "text-stone hover:text-espresso"
              }`}
            >
              {p}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="text-xs uppercase tracking-widest text-stone hover:text-espresso transition-colors disabled:opacity-30 disabled:cursor-not-allowed px-2"
      >
        Trang sau →
      </button>
    </div>
  );
}
