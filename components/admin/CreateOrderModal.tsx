"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/contexts/ToastContext";
import Image from "next/image";
import type { CartItem, SanPham } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";

function formatMoney(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateOrderModal({ isOpen, onClose, onSuccess }: CreateOrderModalProps) {
  const { showSuccess, showError } = useToast();
  const adminPassword = typeof window !== "undefined" ? localStorage.getItem("admin-password") : null;

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SanPham[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [tenKH, setTenKH] = useState("");
  const [sdt, setSdt] = useState("");
  const [diaChi, setDiaChi] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Add dialog state
  const [addDialogSp, setAddDialogSp] = useState<SanPham | null>(null);
  const [addDialogSize, setAddDialogSize] = useState("");
  const [addDialogQty, setAddDialogQty] = useState(1);

  const searchProducts = useCallback(async (term: string) => {
    if (!term.trim()) { setSearchResults([]); setSearched(false); return; }
    setSearchLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/san-pham?search=${encodeURIComponent(term)}&limit=30`, {
        headers: { "x-admin-password": adminPassword || "" },
      });
      const data = await res.json();
      if (data.success) setSearchResults(data.data);
    } catch {
      showError("Không thể tìm sản phẩm");
    } finally {
      setSearchLoading(false);
    }
  }, [adminPassword, showError]);

  useEffect(() => {
    const timer = setTimeout(() => { if (searchTerm.trim()) searchProducts(searchTerm); }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, searchProducts]);

  const openAddDialog = (sp: SanPham) => {
    setAddDialogSp(sp);
    const defaultSize = sp.sizes && sp.sizes.length > 0
      ? sp.sizes.find((s) => s.soLuong > 0)?.ten || sp.sizes[0]?.ten || ""
      : "";
    setAddDialogSize(defaultSize);
    setAddDialogQty(1);
  };

  const confirmAddToCart = () => {
    if (!addDialogSp) return;
    const sizeChon = addDialogSize || null;
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === addDialogSp.id && i.sizeChon === sizeChon);
      if (existing) {
        return prev.map((i) =>
          i.id === addDialogSp.id && i.sizeChon === sizeChon
            ? { ...i, soLuong: i.soLuong + addDialogQty }
            : i
        );
      }
      return [...prev, {
        id: addDialogSp.id,
        ten: addDialogSp.ten,
        giaGoc: addDialogSp.giaGoc,
        phanTramGiam: addDialogSp.phanTramGiam,
        giaHienThi: addDialogSp.giaHienThi,
        anhURL: addDialogSp.anhURL,
        soLuong: addDialogQty,
        sizeChon,
        sizes: addDialogSp.sizes,
      }];
    });
    setAddDialogSp(null);
  };

  const removeFromCart = (id: string, size: string | null) => {
    setCartItems((prev) => prev.filter((i) => !(i.id === id && i.sizeChon === size)));
  };

  const updateQty = (id: string, size: string | null, qty: number) => {
    if (qty <= 0) { removeFromCart(id, size); return; }
    setCartItems((prev) => prev.map((i) => i.id === id && i.sizeChon === size ? { ...i, soLuong: qty } : i));
  };

  const tongTien = cartItems.reduce((s, i) => s + i.giaHienThi * i.soLuong, 0);

  const handleSubmit = async () => {
    if (!tenKH.trim()) { showError("Vui lòng nhập tên khách hàng"); return; }
    if (!sdt.trim()) { showError("Vui lòng nhập số điện thoại"); return; }
    if (!diaChi.trim()) { showError("Vui lòng nhập địa chỉ"); return; }
    if (cartItems.length === 0) { showError("Vui lòng chọn sản phẩm"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/don-hang/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword || "" },
        body: JSON.stringify({ tenKH: tenKH.trim(), sdt: sdt.trim(), diaChi: diaChi.trim(), sanPham: cartItems }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess("Đã tạo đơn hàng thành công!");
        setTenKH(""); setSdt(""); setDiaChi(""); setCartItems([]); setSearchTerm(""); setSearchResults([]); setSearched(false);
        onSuccess(); onClose();
      } else showError(data.error || "Không thể tạo đơn hàng");
    } catch {
      showError("Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setTenKH(""); setSdt(""); setDiaChi(""); setCartItems([]); setSearchTerm(""); setSearchResults([]); setSearched(false); onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[100] bg-espresso/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="fixed inset-0 z-[101] flex items-start justify-center p-4 overflow-y-auto"
            style={{ paddingTop: "2rem", paddingBottom: "2rem" }}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
                <h2 className="font-heading text-xl font-light text-espresso">Thêm đơn hàng mới</h2>
                <button
                  onClick={handleClose}
                  disabled={submitting}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-400 hover:text-espresso transition-colors disabled:opacity-50"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
                <div className="lg:col-span-3 p-6 border-r border-stone-100">
                  <div className="mb-4">
                    <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Tìm sản phẩm</label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Nhập tên sản phẩm..."
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-espresso focus:outline-none focus:border-espresso bg-white"
                    />
                  </div>

                  {searchLoading && (
                    <div className="flex justify-center py-6">
                      <LoadingSpinner size="sm" label="Đang tìm..." />
                    </div>
                  )}

                  {!searchLoading && searched && searchResults.length === 0 && (
                    <p className="text-sm text-stone-400 text-center py-6">Không tìm thấy sản phẩm</p>
                  )}

                  {!searchLoading && searchResults.length > 0 && (
                    <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-1">
                      {searchResults.map((sp) => (
                        <div key={sp.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 transition-colors border border-stone-100">
                          <div className="flex items-center gap-3 min-w-0">
                            {sp.anhURL && (
                              <Image src={sp.anhURL} alt={sp.ten} width={40} height={56} className="w-10 h-14 object-cover rounded flex-shrink-0 bg-stone-100" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm text-espresso font-medium truncate">{sp.ten}</p>
                              <p className="text-xs text-stone-500">
                                {formatMoney(sp.giaHienThi)}
                                {sp.phanTramGiam ? (
                                  <span className="ml-1 text-rose-500">-{sp.phanTramGiam}%</span>
                                ) : null}
                                {sp.conHang ? ` · Còn ${sp.soLuong}` : " · Hết hàng"}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => openAddDialog(sp)}
                            disabled={!sp.conHang}
                            className="flex-shrink-0 px-3 py-1.5 text-xs uppercase tracking-wider bg-espresso text-cream rounded hover:opacity-80 disabled:opacity-30 transition-opacity"
                          >
                            + Thêm
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {cartItems.length > 0 && (
                    <div className="border-t border-stone-200 pt-4 mt-2">
                      <h3 className="text-xs uppercase tracking-wider text-stone-500 mb-3">
                        Sản phẩm đã chọn ({cartItems.length})
                      </h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {cartItems.map((item, idx) => (
                          <div key={`${item.id}-${item.sizeChon || "no-size"}-${idx}`} className="flex items-center justify-between p-2 bg-stone-50 rounded-lg">
                            <div className="flex items-center gap-2 min-w-0">
                              {item.anhURL && (
                                <Image src={item.anhURL} alt={item.ten} width={32} height={40} className="w-8 h-10 object-cover rounded bg-stone-200 flex-shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="text-sm text-espresso truncate">{item.ten}</p>
                                <p className="text-xs text-stone-500">
                                  {item.sizeChon ? `Size: ${item.sizeChon} · ` : ""}
                                  {formatMoney(item.giaHienThi)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => updateQty(item.id, item.sizeChon, item.soLuong - 1)}
                                className="w-6 h-6 flex items-center justify-center rounded-full border border-stone-300 text-stone-500 hover:bg-stone-200 text-sm"
                              >
                                −
                              </button>
                              <span className="text-sm font-medium text-espresso w-6 text-center">{item.soLuong}</span>
                              <button
                                onClick={() => updateQty(item.id, item.sizeChon, item.soLuong + 1)}
                                className="w-6 h-6 flex items-center justify-center rounded-full border border-stone-300 text-stone-500 hover:bg-stone-200 text-sm"
                              >
                                +
                              </button>
                              <button
                                onClick={() => removeFromCart(item.id, item.sizeChon)}
                                className="ml-1 text-stone-400 hover:text-rose-500 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-stone-200 flex justify-between items-center">
                        <span className="text-sm text-stone-500">Tạm tính</span>
                        <span className="text-base font-bold text-espresso">{formatMoney(tongTien)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-2 p-6">
                  <h3 className="text-xs uppercase tracking-wider text-stone-500 mb-4">Thông tin khách hàng</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Tên khách hàng *</label>
                      <input
                        type="text"
                        value={tenKH}
                        onChange={(e) => setTenKH(e.target.value)}
                        placeholder="VD: Nguyễn Văn A"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-espresso focus:outline-none focus:border-espresso bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Số điện thoại *</label>
                      <input
                        type="tel"
                        value={sdt}
                        onChange={(e) => setSdt(e.target.value)}
                        placeholder="VD: 0912345678"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-espresso focus:outline-none focus:border-espresso bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-stone-500 mb-1">Địa chỉ *</label>
                      <textarea
                        value={diaChi}
                        onChange={(e) => setDiaChi(e.target.value)}
                        placeholder="Địa chỉ giao hàng"
                        rows={3}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-espresso focus:outline-none focus:border-espresso bg-white resize-none"
                      />
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-stone-200">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-stone-500">Tổng tiền</span>
                      <span className="text-lg font-bold text-espresso">{formatMoney(tongTien)}</span>
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || cartItems.length === 0}
                      className="w-full py-3 bg-espresso text-cream text-xs uppercase tracking-widest hover:opacity-80 disabled:opacity-40 transition-opacity rounded-lg font-medium"
                    >
                      {submitting ? "Đang tạo đơn..." : "Tạo đơn hàng"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Add Product Dialog */}
          <AnimatePresence>
            {addDialogSp && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setAddDialogSp(null)}
                  className="fixed inset-0 z-[200] bg-espresso/50 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  transition={{ type: "spring", duration: 0.3 }}
                  className="fixed inset-0 z-[201] flex items-center justify-center p-4"
                >
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
                    <h3 className="font-heading text-lg font-light text-espresso mb-1">Thêm sản phẩm</h3>
                    <p className="text-sm text-stone-500 mb-4 truncate">{addDialogSp.ten}</p>

                    {addDialogSp.sizes && addDialogSp.sizes.length > 0 && (
                      <div className="mb-4">
                        <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">Chọn size</label>
                        <div className="flex flex-wrap gap-2">
                          {addDialogSp.sizes.map((s) => (
                            <button
                              key={s.ten}
                              type="button"
                              disabled={s.soLuong <= 0}
                              onClick={() => setAddDialogSize(s.ten)}
                              className={`min-w-[40px] px-3 py-1.5 text-xs rounded-lg border transition-all ${
                                addDialogSize === s.ten
                                  ? "bg-espresso text-cream border-espresso"
                                  : s.soLuong > 0
                                  ? "bg-white text-espresso border-stone-300 hover:border-espresso"
                                  : "bg-stone-50 text-stone-300 border-stone-200 line-through cursor-not-allowed"
                              }`}
                            >
                              {s.ten}
                              <span className="block text-[10px] mt-0.5 opacity-60">{s.soLuong}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mb-6">
                      <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">Số lượng</label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setAddDialogQty(Math.max(1, addDialogQty - 1))}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-300 text-stone-500 hover:bg-stone-100"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={addDialogQty}
                          onChange={(e) => setAddDialogQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-16 text-center px-2 py-1.5 border border-stone-300 rounded-lg text-sm text-espresso focus:outline-none focus:border-espresso"
                        />
                        <button
                          type="button"
                          onClick={() => setAddDialogQty(addDialogQty + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-300 text-stone-500 hover:bg-stone-100"
                        >
                          +
                        </button>
                        {addDialogSp.sizes && addDialogSp.sizes.length > 0 && (
                          <span className="text-xs text-stone-400 ml-2">
                            Tồn: {addDialogSp.sizes.find((s) => s.ten === addDialogSize)?.soLuong || 0}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setAddDialogSp(null)}
                        className="flex-1 py-2.5 text-xs uppercase tracking-widest border border-stone-300 text-stone-500 hover:bg-stone-50 rounded-lg transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={confirmAddToCart}
                        className="flex-1 py-2.5 bg-espresso text-cream text-xs uppercase tracking-widest hover:opacity-80 rounded-lg transition-opacity"
                      >
                        Thêm
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}