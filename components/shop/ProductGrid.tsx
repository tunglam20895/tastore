"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import type { SanPham, DanhMuc } from "@/types";
import ProductCard from "./ProductCard";
import PaginationShop from "./PaginationShop";

const LIMIT = 12;

export default function ProductGrid() {
  const [products, setProducts] = useState<SanPham[]>([]);
  const [categories, setCategories] = useState<DanhMuc[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/danh-muc").then((r) => r.json()).then((d) => { if (d.success) setCategories(d.data); }).catch(() => {});
  }, []);

  const loadProducts = useCallback((p = 1, cat = selectedCategory, s = search) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT), con_hang: "true" });
    if (cat) params.set("danh_muc", cat);
    if (s) params.set("search", s);
    fetch(`/api/san-pham?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProducts(data.data);
          setTotalPages(data.totalPages ?? 1);
          setPage(p);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedCategory, search]);

  useEffect(() => { loadProducts(1); }, [loadProducts]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setPage(1);
    loadProducts(1, cat, search);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    loadProducts(1, selectedCategory, searchInput);
  };

  const handlePageChange = (p: number) => {
    loadProducts(p);
    // Scroll lên đầu section sản phẩm
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div ref={gridRef}>
      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="flex justify-center mb-8">
        <div className="flex w-full max-w-sm border border-stone/30 focus-within:border-espresso transition-colors">
          <input
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              if (e.target.value === "") { setSearch(""); loadProducts(1, selectedCategory, ""); }
            }}
            placeholder="Tìm kiếm sản phẩm..."
            className="flex-1 px-4 py-2.5 text-sm text-espresso bg-transparent focus:outline-none placeholder:text-stone/50"
          />
          <button type="submit" className="px-4 text-stone hover:text-espresso transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>
      </form>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex gap-2.5 overflow-x-auto pb-2 mb-12 justify-center flex-wrap scrollbar-hide">
          <button
            onClick={() => handleCategoryChange("")}
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
              onClick={() => handleCategoryChange(cat.id)}
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

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border border-espresso border-t-transparent rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24">
          <p className="font-heading text-2xl font-light text-stone-400">Chưa có sản phẩm nào</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
          <PaginationShop page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  );
}
