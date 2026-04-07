"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { SanPham, CartItem } from "@/types";

export default function ProductCard({ product, index = 0 }: { product: SanPham; index?: number }) {
  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.conHang || product.soLuong === 0) return;
    const cart: CartItem[] = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      if (existing.soLuong < product.soLuong) existing.soLuong += 1;
    } else {
      cart.push({
        id: product.id,
        ten: product.ten,
        giaGoc: product.giaGoc,
        phanTramGiam: product.phanTramGiam,
        giaHienThi: product.giaHienThi,
        anhURL: product.anhURL,
        soLuong: 1,
        sizeChon: null,
      });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
    >
      <Link href={`/san-pham/${product.id}`} className="group block">
        {/* Image — portrait 3:4 */}
        <div className="relative aspect-[3/4] overflow-hidden bg-blush mb-4">
          {product.anhURL ? (
            <Image
              src={product.anhURL}
              alt={product.ten}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-stone-400 text-sm">
              Không có ảnh
            </div>
          )}

          {/* Discount badge */}
          {product.phanTramGiam && product.phanTramGiam > 0 && (
            <span className="absolute top-3 right-3 bg-espresso text-cream text-xs font-medium px-2.5 py-1 rounded-full">
              -{product.phanTramGiam}%
            </span>
          )}

          {/* Sắp hết hàng badge */}
          {product.conHang && product.soLuong > 0 && product.soLuong <= 5 && (
            <span className="absolute bottom-3 left-3 text-xs text-rose font-medium">
              Còn {product.soLuong} sản phẩm
            </span>
          )}

          {/* Hết hàng overlay */}
          {!product.conHang || product.soLuong === 0 ? (
            <div className="absolute inset-0 bg-cream/40 flex items-center justify-center">
              <span className="text-xs uppercase tracking-widest text-espresso font-medium">
                Hết Hàng
              </span>
            </div>
          ) : null}

          {/* Quick add button — appears on hover */}
          {product.conHang && product.soLuong > 0 && (
            <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <button
                onClick={handleQuickAdd}
                className="w-full bg-cream/90 backdrop-blur-sm text-espresso text-xs uppercase tracking-widest py-3 font-medium hover:bg-cream transition-colors"
              >
                Thêm Vào Giỏ
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h3 className="font-heading text-base font-light text-espresso line-clamp-2 leading-snug mt-3">
            {product.ten}
          </h3>
          <div className="flex items-baseline gap-2 mt-1.5">
            {product.phanTramGiam && product.phanTramGiam > 0 ? (
              <>
                <span className="font-medium text-espresso">
                  {product.giaHienThi.toLocaleString("vi-VN")}đ
                </span>
                <span className="text-stone line-through text-sm">
                  {product.giaGoc.toLocaleString("vi-VN")}đ
                </span>
              </>
            ) : (
              <span className="font-medium text-espresso">
                {product.giaHienThi.toLocaleString("vi-VN")}đ
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
