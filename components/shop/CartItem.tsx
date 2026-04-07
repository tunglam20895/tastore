import Image from "next/image";
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
}: {
  item: CartItemType;
  onUpdate: (quantity: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-start gap-5 py-6 border-b border-blush">
      {/* Image — 3/4 aspect */}
      <div className="relative w-20 flex-shrink-0 overflow-hidden bg-blush" style={{ aspectRatio: "3/4" }}>
        {item.anhURL ? (
          <Image src={item.anhURL} alt={item.ten} fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-stone-400 text-xs">Ảnh</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-heading text-base font-light text-espresso line-clamp-2 leading-snug mb-1">
          {item.ten}
        </h4>
        <div className="flex items-baseline gap-2 mb-4">
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
        <div className="flex items-center gap-4">
          {/* Qty control */}
          <div className="flex items-center border border-stone/30">
            <button
              onClick={() => onUpdate(Math.max(1, item.soLuong - 1))}
              className="w-7 h-7 flex items-center justify-center text-espresso hover:bg-blush transition-colors text-sm"
            >
              −
            </button>
            <span className="w-8 text-center text-xs font-medium text-espresso">{item.soLuong}</span>
            <button
              onClick={() => onUpdate(item.soLuong + 1)}
              className="w-7 h-7 flex items-center justify-center text-espresso hover:bg-blush transition-colors text-sm"
            >
              +
            </button>
          </div>

          <span className="text-sm font-medium text-espresso ml-auto">
            {(item.giaHienThi * item.soLuong).toLocaleString("vi-VN")}đ
          </span>

          <button
            onClick={onRemove}
            className="text-stone/50 hover:text-rose transition-colors ml-1"
            aria-label="Xóa sản phẩm"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
