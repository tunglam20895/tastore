"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { SanPham, DanhMuc } from "@/types";
import ProductCard from "./ProductCard";

export default function ProductGrid() {
  const [products, setProducts] = useState<SanPham[]>([]);
  const [categories, setCategories] = useState<DanhMuc[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/san-pham").then((res) => res.json()),
      fetch("/api/danh-muc").then((res) => res.json()),
    ])
      .then(([productsRes, categoriesRes]) => {
        if (productsRes.success) setProducts(productsRes.data);
        if (categoriesRes.success) setCategories(categoriesRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.danhMuc === selectedCategory)
    : products;

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border border-espresso border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Pill filter bar */}
      {categories.length > 0 && (
        <div className="flex gap-2.5 overflow-x-auto pb-2 mb-12 justify-center flex-wrap scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-5 py-2 text-xs uppercase tracking-widest font-medium transition-all duration-200 rounded-full whitespace-nowrap ${
              selectedCategory === ""
                ? "bg-espresso text-cream"
                : "border border-stone text-stone hover:bg-blush hover:border-blush"
            }`}
          >
            Tất Cả
          </button>
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2 text-xs uppercase tracking-widest font-medium transition-all duration-200 rounded-full whitespace-nowrap ${
                selectedCategory === cat.id
                  ? "bg-espresso text-cream"
                  : "border border-stone text-stone hover:bg-blush hover:border-blush"
              }`}
            >
              {cat.tenDanhMuc}
            </motion.button>
          ))}
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <div className="text-center py-24">
          <p className="font-heading text-2xl font-light text-stone-400">
            Chưa có sản phẩm nào
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6">
          {filteredProducts.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
