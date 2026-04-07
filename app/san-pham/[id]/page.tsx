"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { SanPham, CartItem as CartItemType, DanhMuc } from "@/types";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<SanPham | null>(null);
  const [categories, setCategories] = useState<DanhMuc[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    Promise.all([
      fetch("/api/san-pham").then((res) => res.json()),
      fetch("/api/danh-muc").then((res) => res.json()),
    ])
      .then(([productsRes, categoriesRes]) => {
        if (productsRes.success) {
          const found = productsRes.data.find((p: SanPham) => p.id === params.id);
          setProduct(found || null);
        }
        if (categoriesRes.success) setCategories(categoriesRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  const addToCart = useCallback((buyNow = false) => {
    if (!product || product.soLuong === 0) return;
    const cart: CartItemType[] = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      existing.soLuong = Math.min(existing.soLuong + qty, product.soLuong);
    } else {
      cart.push({
        id: product.id,
        ten: product.ten,
        giaGoc: product.giaGoc,
        phanTramGiam: product.phanTramGiam,
        giaHienThi: product.giaHienThi,
        anhURL: product.anhURL,
        soLuong: qty,
      });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    if (buyNow) {
      router.push("/dat-hang");
    } else {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  }, [product, qty, router]);

  if (loading) {
    return (
      <div className="flex justify-center py-24 pt-32">
        <div className="w-8 h-8 border border-espresso border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 pt-32 text-center">
        <p className="font-heading text-2xl font-light text-stone-400 mb-6">Không tìm thấy sản phẩm</p>
        <button onClick={() => router.push("/")} className="text-xs uppercase tracking-widest text-espresso hover:text-rose transition-colors">
          Quay về trang chủ
        </button>
      </div>
    );
  }

  const hasDiscount = product.phanTramGiam && product.phanTramGiam > 0;
  const isOutOfStock = !product.conHang || product.soLuong === 0;
  const categoryName = categories.find((c) => c.id === product.danhMuc)?.tenDanhMuc;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 pt-28">
      {/* Breadcrumb */}
      <div className="flex gap-2 text-xs uppercase tracking-widest text-stone mb-10">
        <Link href="/" className="hover:text-espresso transition-colors">Trang Chủ</Link>
        <span>/</span>
        {categoryName && (
          <>
            <Link href="/" className="hover:text-espresso transition-colors">{categoryName}</Link>
            <span>/</span>
          </>
        )}
        <span className="text-espresso">{product.ten}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-start">
        {/* Image — sticky on scroll */}
        <div className="md:sticky md:top-28">
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
        <div className="py-4">
          <h1 className="font-heading text-3xl md:text-4xl font-light text-espresso leading-tight mb-6">
            {product.ten}
          </h1>

          {/* Price */}
          <div className="mb-3">
            {hasDiscount ? (
              <div className="flex items-baseline gap-3">
                <p className="text-stone line-through text-sm">
                  {product.giaGoc.toLocaleString("vi-VN")}đ
                </p>
                <p className="text-2xl font-medium text-espresso">
                  {product.giaHienThi.toLocaleString("vi-VN")}đ
                </p>
                <span className="text-xs bg-espresso text-cream px-2 py-0.5 rounded-full">
                  -{product.phanTramGiam}%
                </span>
              </div>
            ) : (
              <p className="text-2xl font-medium text-espresso">
                {product.giaHienThi.toLocaleString("vi-VN")}đ
              </p>
            )}
          </div>

          {/* Stock info */}
          {!isOutOfStock && (
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
                  <span className="w-10 text-center text-sm font-medium text-espresso">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(product.soLuong, q + 1))}
                    className="w-9 h-9 flex items-center justify-center text-espresso hover:bg-blush transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <button
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

          {/* Shipping info */}
          <div className="mt-6 flex items-center gap-3 text-xs text-stone uppercase tracking-wider">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
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
