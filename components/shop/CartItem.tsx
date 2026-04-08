import Image from "next/image";
import { useState, useEffect } from "react";
import type { CartItem as CartItemType } from "@/types";

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

export default function CartItem({
  item,
  onUpdate,
  onRemove,
  onUpdateSize,
}: {
  item: CartItemType;
  onUpdate: (quantity: number) => void;
  onRemove: () => void;
  onUpdateSize: (newSize: string | null) => void;
}) {
  const hasSizes = item.sizes && item.sizes.length > 0;
  const [sizeChonLocal, setSizeChonLocal] = useState<string | null>(item.sizeChon);

  // Sync local state when item.sizeChon changes externally
  useEffect(() => {
    setSizeChonLocal(item.sizeChon);
  }, [item.sizeChon]);

  const handleSizeSelect = (sizeName: string) => {
    setSizeChonLocal(sizeName);
    onUpdateSize(sizeName);
  };

  const isSizeOutOfStock = sizeChonLocal
    ? (item.sizes?.find((s) => s.ten === sizeChonLocal)?.soLuong ?? 1) === 0
    : false;

  return (
    <div className="flex items-start gap-3 md:gap-5 py-5 md:py-6 border-b border-blush">
      {/* Image — 3/4 aspect */}
      <div className="relative w-16 md:w-20 flex-shrink-0 overflow-hidden bg-blush" style={{ aspectRatio: "3/4" }}>
        {item.anhURL ? (
          <Image src={item.anhURL} alt={item.ten} fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-stone-400 text-xs">Ảnh</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-heading text-sm md:text-base font-light text-espresso line-clamp-2 leading-snug mb-1">
          {item.ten}
        </h4>

        {/* Size selector */}
        {hasSizes && (
          <div className="mb-2">
            <div className="flex flex-wrap gap-1.5">
              {item.sizes!.map((s) => {
                const outOfStock = s.soLuong === 0;
                const isSelected = sizeChonLocal === s.ten;
                return (
                  <button
                    key={s.ten}
                    type="button"
                    disabled={outOfStock}
                    onClick={() => {
                      if (!outOfStock) handleSizeSelect(s.ten);
                    }}
                    className={`relative min-w-[2.5rem] h-8 px-2.5 text-[11px] font-medium border transition-all duration-200 ${
                      outOfStock
                        ? "border-stone-200 text-stone-300 cursor-not-allowed bg-stone-50"
                        : isSelected
                        ? "bg-espresso text-cream border-espresso"
                        : "border-stone/30 text-espresso hover:border-espresso"
                    }`}
                  >
                    {s.ten}
                    {outOfStock && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="absolute w-full h-px bg-stone-300 rotate-[-20deg]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {isSizeOutOfStock && (
              <p className="text-[10px] text-rose mt-1">Size này đã hết hàng</p>
            )}
          </div>
        )}

        {!hasSizes && (
          <p className="text-xs text-stone-500 mb-1">
            Size: <span className="font-medium text-espresso">Mặc định</span>
          </p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3 md:mb-4">
          {item.phanTramGiam && item.phanTramGiam > 0 ? (
            <>
              <span className="text-xs text-stone line-through">
                {item.giaGoc.toLocaleString("vi-VN")}đ
              </span>
              <span className="text-sm text-espresso font-medium">
                {item.giaHienThi.toLocaleString("vi-VN")}đ
              </span>
            </>
          ) : (
            <span className="text-sm text-espresso font-medium">
              {item.giaHienThi.toLocaleString("vi-VN")}đ
            </span>
          )}
        </div>

        {/* Qty + subtotal + remove */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Qty control */}
          <div className="flex items-center border border-stone/30">
            <button
              onClick={() => onUpdate(Math.max(1, item.soLuong - 1))}
              className="w-9 h-9 flex items-center justify-center text-espresso hover:bg-blush transition-colors text-sm"
            >
              −
            </button>
            <span className="w-8 text-center text-xs font-medium text-espresso">{item.soLuong}</span>
            <button
              onClick={() => onUpdate(item.soLuong + 1)}
              className="w-9 h-9 flex items-center justify-center text-espresso hover:bg-blush transition-colors text-sm"
            >
              +
            </button>
          </div>

          <span className="text-sm font-medium text-espresso ml-auto">
            {(item.giaHienThi * item.soLuong).toLocaleString("vi-VN")}đ
          </span>

          <button
            onClick={onRemove}
            className="p-2 text-stone/50 hover:text-rose transition-colors"
            aria-label="Xóa sản phẩm"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
