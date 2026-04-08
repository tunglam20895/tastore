"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import type { SanPham, DanhMuc } from "@/types";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<SanPham | null>(null);
  const [categories, setCategories] = useState<DanhMuc[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const [sizeChon, setSizeChon] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/san-pham/${params.id}`).then((r) => r.json()).catch(() => null),
      fetch("/api/san-pham").then((r) => r.json()).catch(() => null),
      fetch("/api/danh-muc").then((r) => r.json()).catch(() => null),
    ]).then(([singleRes, allRes, catsRes]) => {
      // Ưu tiên fetch single nếu có route, fallback về fetch all
      if (singleRes?.success && singleRes.data) {
        setProduct(singleRes.data);
      } else if (allRes?.success) {
        const found = (allRes.data as SanPham[]).find((p) => p.id === params.id);
        setProduct(found || null);
      }
      if (catsRes?.success) setCategories(catsRes.data);
    }).finally(() => setLoading(false));
  }, [params.id]);

  // Tồn kho của size đang chọn
  const selectedSizeStock = sizeChon && product?.sizes.length
    ? (product.sizes.find((s) => s.ten === sizeChon)?.soLuong ?? 0)
    : (product?.soLuong ?? 0);

  const maxQty = selectedSizeStock;

  const { addItem, triggerFly } = useCart();
  const addButtonRef = useRef<HTMLButtonElement>(null);

  const addToCart = useCallback(
    (buyNow = false) => {
      if (!product || product.soLuong === 0) return;

      // Validate: phải chọn size nếu sản phẩm có sizes
      if (product.sizes.length > 0 && !sizeChon) {
        setSizeError(true);
        setTimeout(() => setSizeError(false), 2500);
        return;
      }

      // Validate: size đã chọn còn hàng không
      if (sizeChon) {
        const sizeItem = product.sizes.find((s) => s.ten === sizeChon);
        if (sizeItem && sizeItem.soLuong === 0) return;
      }

      // Trigger fly animation từ vị trí nút thêm giỏ
      if (addButtonRef.current) {
        const rect = addButtonRef.current.getBoundingClientRect();
        triggerFly(rect.left + rect.width / 2, rect.top + rect.height / 2, product.anhURL);
      }

      addItem({
        id: product.id,
        ten: product.ten,
        giaGoc: product.giaGoc,
        phanTramGiam: product.phanTramGiam,
        giaHienThi: product.giaHienThi,
        anhURL: product.anhURL,
        soLuong: qty,
        sizeChon: sizeChon,
        sizes: product.sizes,
      });

      if (buyNow) {
        router.push("/dat-hang");
      } else {
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      }
    },
    [product, qty, sizeChon, router, addItem, triggerFly]
  );

  if (loading) {
    return (
      <div className="flex justify-center py-16 md:py-24 pt-24 md:pt-32">
        <div className="w-8 h-8 border border-espresso border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-16 md:py-24 pt-24 md:pt-32 text-center">
        <p className="font-heading text-xl md:text-2xl font-light text-stone-400 mb-6">
          Không tìm thấy sản phẩm
        </p>
        <button
          onClick={() => router.push("/")}
          className="text-xs uppercase tracking-widest text-espresso hover:text-rose transition-colors"
        >
          Quay về trang chủ
        </button>
      </div>
    );
  }

  const hasDiscount = product.phanTramGiam && product.phanTramGiam > 0;
  const isOutOfStock = !product.conHang || product.soLuong === 0;
  const categoryName = categories.find((c) => c.id === product.danhMuc)?.tenDanhMuc;
  const hasSizes = product.sizes && product.sizes.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12 pt-20 md:pt-28">
      {/* Breadcrumb */}
      <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] md:text-xs uppercase tracking-widest text-stone mb-6 md:mb-10">
        <Link href="/" className="hover:text-espresso transition-colors">
          Trang Chủ
        </Link>
        <span>/</span>
        {categoryName && (
          <>
            <Link href="/" className="hover:text-espresso transition-colors">
              {categoryName}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-espresso truncate">{product.ten}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 lg:gap-20 items-start">
        {/* Ảnh — sticky */}
        <div className="md:sticky md:top-24 lg:top-28">
          <div className="relative aspect-[3/4] overflow-hidden bg-blush">
            {product.anhURL ? (
              <Image
                src={product.anhURL}
                alt={product.ten}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full text-stone-400 text-sm">
                Không có ảnh
              </div>
            )}
            {hasDiscount && (
              <span className="absolute top-4 right-4 bg-espresso text-cream text-xs font-medium px-3 py-1 rounded-full">
                -{product.phanTramGiam}%
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="py-2 md:py-4">
          <h1 className="font-heading text-2xl md:text-3xl lg:text-4xl font-light text-espresso leading-tight mb-4 md:mb-6">
            {product.ten}
          </h1>

          {/* Giá */}
          <div className="mb-3">
            {hasDiscount ? (
              <div className="flex items-baseline gap-3">
                <p className="text-stone line-through text-xs md:text-sm">
                  {product.giaGoc.toLocaleString("vi-VN")}đ
                </p>
                <p className="text-xl md:text-2xl font-medium text-espresso">
                  {product.giaHienThi.toLocaleString("vi-VN")}đ
                </p>
                <span className="text-xs bg-espresso text-cream px-2 py-0.5 rounded-full">
                  -{product.phanTramGiam}%
                </span>
              </div>
            ) : (
              <p className="text-xl md:text-2xl font-medium text-espresso">
                {product.giaHienThi.toLocaleString("vi-VN")}đ
              </p>
            )}
          </div>

          {/* Tồn kho (chỉ hiện khi không có sizes) */}
          {!isOutOfStock && !hasSizes && (
            <p className={`text-xs mb-4 ${product.soLuong <= 5 ? "text-rose" : "text-stone"}`}>
              Còn lại: {product.soLuong} sản phẩm
            </p>
          )}

          <div className="w-full h-px bg-blush mb-6" />

          {product.moTa && (
            <div className="mb-8">
              <p className="text-sm text-stone-500 leading-relaxed whitespace-pre-line">
                {product.moTa}
              </p>
            </div>
          )}

          <div className="w-full h-px bg-blush mb-8" />

          {isOutOfStock ? (
            <div className="text-center py-4 border border-stone/20 mb-3">
              <span className="text-xs uppercase tracking-widest text-stone">Hết Hàng</span>
            </div>
          ) : (
            <>
              {/* Size selector */}
              {hasSizes && (
                <div className="mb-6">
                  <p
                    className={`text-xs uppercase tracking-widest mb-3 transition-colors ${
                      sizeError ? "text-rose" : "text-stone"
                    }`}
                  >
                    {sizeError ? "Vui lòng chọn size" : "Chọn size"}
                    {sizeChon && (
                      <span className="ml-2 font-medium text-espresso normal-case tracking-normal">
                        — {sizeChon}
                        {selectedSizeStock <= 5 && selectedSizeStock > 0 && (
                          <span className="ml-1 text-rose">(còn {selectedSizeStock})</span>
                        )}
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s) => {
                      const outOfStock = s.soLuong === 0;
                      const isSelected = sizeChon === s.ten;
                      return (
                        <button
                          key={s.ten}
                          type="button"
                          disabled={outOfStock}
                          onClick={() => {
                            if (!outOfStock) {
                              setSizeChon(s.ten);
                              setSizeError(false);
                              setQty(1);
                            }
                          }}
                          className={`relative min-w-[2.75rem] h-10 px-3 text-xs font-medium border transition-all duration-200 ${
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
                  {/* Gợi ý size chart nếu cần */}
                </div>
              )}

              {/* Qty selector */}
              <div className="flex items-center gap-4 mb-6">
                <p className="text-xs uppercase tracking-widest text-stone">Số lượng</p>
                <div className="flex items-center border border-stone/30">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center text-espresso hover:bg-blush transition-colors"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-sm font-medium text-espresso">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty((q) => Math.min(maxQty || 99, q + 1))}
                    className="w-9 h-9 flex items-center justify-center text-espresso hover:bg-blush transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  ref={addButtonRef}
                  onClick={() => addToCart(false)}
                  className={`w-full py-4 text-xs uppercase tracking-widest font-medium transition-all duration-300 ${
                    added
                      ? "bg-stone text-cream"
                      : "bg-espresso text-cream hover:opacity-80"
                  }`}
                >
                  {added ? "Đã Thêm Vào Giỏ ✓" : "Thêm Vào Giỏ Hàng"}
                </button>
                <button
                  onClick={() => addToCart(true)}
                  className="w-full py-4 text-xs uppercase tracking-widest font-medium border border-espresso text-espresso hover:bg-espresso hover:text-cream transition-all duration-300"
                >
                  Mua Ngay
                </button>
              </div>
            </>
          )}

          {/* Shipping */}
          <div className="mt-6 flex items-center gap-3 text-xs text-stone uppercase tracking-wider">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="flex-shrink-0"
            >
              <rect x="1" y="3" width="15" height="13" rx="1" />
              <path d="M16 8h4l3 5v3h-7V8z" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            <span>Miễn phí vận chuyển — Ship COD toàn quốc</span>
          </div>
        </div>
      </div>
    </div>
  );
}
