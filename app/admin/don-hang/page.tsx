"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdminChat } from "@/contexts/AdminChatContext";
import OrderTable from "@/components/admin/OrderTable";
import Pagination from "@/components/admin/Pagination";
import LoadingSpinner from "@/components/LoadingSpinner";
import CreateOrderModal from "@/components/admin/CreateOrderModal";
import type { DonHang } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { useTrangThaiDH } from "@/contexts/TrangThaiDHContext";
import OrderDetailModal from "@/components/admin/OrderDetailModal";

const LIMIT_DEFAULT = 20;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<DonHang[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(LIMIT_DEFAULT);

  // Create order modal
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Filters
  const [trangThai, setTrangThai] = useState("");
  const [searchTen, setSearchTen] = useState("");
  const [searchTenInput, setSearchTenInput] = useState("");
  const [searchSdt, setSearchSdt] = useState("");
  const [searchSdtInput, setSearchSdtInput] = useState("");
  const [tuNgay, setTuNgay] = useState("");
  const [denNgay, setDenNgay] = useState("");

  // Bulk select
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Order detail modal
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { showSuccess, showError } = useToast();
  const { trangThais } = useTrangThaiDH();

  const loadOrders = useCallback((
    p: number, tt: string, ten: string, sdt: string, tu: string, den: string, signal?: AbortSignal, lim?: number
  ) => {
    setLoading(true);
    setSelectedIds([]);
    const l = lim ?? limit;
    const params = new URLSearchParams({ page: String(p), limit: String(l) });
    if (tt) params.set("trang_thai", tt);
    if (ten) params.set("search_ten", ten);
    if (sdt) params.set("search_sdt", sdt);
    if (tu) params.set("tu_ngay", tu);
    if (den) params.set("den_ngay", den);
    fetch(`/api/don-hang?${params}`, { signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOrders(data.data);
          setTotal(data.total ?? data.data.length);
          setTotalPages(data.totalPages ?? 1);
          setPage(p);
        }
      })
      .catch((err) => { if (err.name !== "AbortError") {} })
      .finally(() => setLoading(false));
  }, [limit]);

  useEffect(() => {
    const controller = new AbortController();
    loadOrders(page, trangThai, searchTen, searchSdt, tuNgay, denNgay, controller.signal);
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, trangThai, searchTen, searchSdt, tuNgay, denNgay, limit]);

  const handleTrangThaiChange = (tt: string) => {
    setTrangThai(tt);
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTen(searchTenInput);
    setSearchSdt(searchSdtInput);
    setPage(1);
  };

  const handleDateChange = (tu: string, den: string) => {
    setTuNgay(tu);
    setDenNgay(den);
    setPage(1);
  };

  const handleReset = () => {
    setTrangThai(""); setSearchTen(""); setSearchTenInput("");
    setSearchSdt(""); setSearchSdtInput(""); setTuNgay(""); setDenNgay("");
    setPage(1);
  };

  const handleBulkStatus = async (status: DonHang["trangThai"]) => {
    if (!selectedIds.length) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/don-hang/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, trangThai: status }),
      });
      const data = await res.json();
      if (data.success) {
        showSuccess(`Đã cập nhật ${data.updated} đơn hàng`);
        loadOrders(page, trangThai, searchTen, searchSdt, tuNgay, denNgay);
      } else {
        showError(data.error || "Cập nhật thất bại");
      }
    } catch {
      showError("Không thể cập nhật hàng loạt");
    } finally {
      setBulkLoading(false);
    }
  };

  const doExport = async (ids: string[]) => {
    setExportLoading(true);
    try {
      const res = await fetch("/api/don-hang/export-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        const err = await res.json();
        showError(err.error || "Xuất file thất bại");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `don-hang-${date}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess(`Đã xuất ${ids.length} đơn và chuyển sang "Đã lên đơn"`);
      loadOrders(page, trangThai, searchTen, searchSdt, tuNgay, denNgay);
    } catch {
      showError("Không thể xuất file Excel");
    } finally {
      setExportLoading(false);
    }
  };

  // Xuất tất cả đơn "Chốt để lên đơn" (không cần tích chọn)
  const handleExportChotDonHang = async () => {
    setExportLoading(true);
    try {
      const res = await fetch(`/api/don-hang?trang_thai=${encodeURIComponent("Chốt để lên đơn")}`);
      const data = await res.json();
      if (!data.success || !data.data?.length) {
        showError("Không có đơn nào ở trạng thái Chốt để lên đơn");
        setExportLoading(false);
        return;
      }
      const ids: string[] = data.data.map((o: { id: string }) => o.id);
      await doExport(ids);
    } catch {
      showError("Không thể tải danh sách đơn");
      setExportLoading(false);
    }
  };

  const handleExport = async () => {
    if (!selectedIds.length) {
      showError("Vui lòng chọn đơn hàng cần xuất");
      return;
    }
    await doExport(selectedIds);
  };

  const hasFilters = trangThai || searchTen || searchSdt || tuNgay || denNgay;

  // ─── Push data to AdminChat context ────────────────────────────────────────
  const { setScreenData } = useAdminChat();

  useEffect(() => {
    if (!loading && orders.length >= 0) {
      const filters: string[] = [];
      if (trangThai) filters.push(`Trạng thái: ${trangThai}`);
      if (searchTen) filters.push(`Tìm tên: "${searchTen}"`);
      if (searchSdt) filters.push(`Tìm SĐT: "${searchSdt}"`);
      if (tuNgay) filters.push(`Từ ngày: ${tuNgay}`);
      if (denNgay) filters.push(`Đến ngày: ${denNgay}`);

      const fmtNum = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

      setScreenData({
        page: 'don-hang',
        title: 'Quản lý đơn hàng',
        summary: `Đang hiển thị ${orders.length} đơn (trang ${page}/${totalPages}). Tổng ${total} đơn.`,
        filters,
        stats: { 'Tổng đơn': total, 'Đang hiển thị': orders.length, 'Đã chọn': selectedIds.length },
        items: orders.map(o =>
          `[${o.trangThai}] ${o.tenKH} (${o.sdt}) | ${fmtNum(o.sanPham.length)} sp | ${o.tongTien.toLocaleString('vi-VN')}đ | NV: ${o.nguoiXuLy} | ${new Date(o.thoiGian).toLocaleDateString('vi-VN')}`
        ),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, trangThai, searchTen, searchSdt, tuNgay, denNgay, page, totalPages, total, loading, selectedIds]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-heading text-xl sm:text-2xl font-light text-espresso">Quản lý đơn hàng</h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-espresso text-cream text-[10px] sm:text-xs uppercase tracking-widest hover:opacity-80 transition-opacity rounded"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Thêm đơn hàng
          </button>
          <button
            onClick={handleExportChotDonHang}
            disabled={exportLoading}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-teal-600 text-white text-[10px] sm:text-xs uppercase tracking-widest hover:bg-teal-700 disabled:opacity-50 transition-colors rounded"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            {exportLoading ? "Đang xuất..." : "Xuất Excel (Chốt)"}
          </button>
          <button
            onClick={() => loadOrders(page, trangThai, searchTen, searchSdt, tuNgay, denNgay)}
            className="text-xs uppercase tracking-widest text-stone-400 hover:text-espresso transition-colors"
          >
            Làm mới
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 mb-6">
        <input
          value={searchTenInput}
          onChange={(e) => setSearchTenInput(e.target.value)}
          placeholder="Tìm tên khách hàng..."
          className="px-3 py-1.5 border border-stone-300 rounded text-sm text-espresso focus:outline-none focus:border-espresso bg-white w-full sm:w-44"
        />
        <input
          value={searchSdtInput}
          onChange={(e) => setSearchSdtInput(e.target.value)}
          placeholder="Tìm SĐT..."
          className="px-3 py-1.5 border border-stone-300 rounded text-sm text-espresso focus:outline-none focus:border-espresso bg-white w-full sm:w-36"
        />
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-stone-400">Từ</span>
          <input type="date" value={tuNgay} onChange={(e) => handleDateChange(e.target.value, denNgay)}
            className="px-2 py-1.5 border border-stone-300 rounded text-xs text-espresso focus:outline-none focus:border-espresso bg-white" />
          <span className="text-xs text-stone-400">đến</span>
          <input type="date" value={denNgay} onChange={(e) => handleDateChange(tuNgay, e.target.value)}
            className="px-2 py-1.5 border border-stone-300 rounded text-xs text-espresso focus:outline-none focus:border-espresso bg-white" />
        </div>
        <button type="submit" className="px-4 py-1.5 bg-espresso text-cream text-xs uppercase tracking-widest hover:opacity-80">
          Tìm
        </button>
        {hasFilters && (
          <button type="button" onClick={handleReset}
            className="px-3 py-1.5 border border-stone-300 rounded text-xs text-stone-500 hover:text-espresso">
            Xóa lọc
          </button>
        )}
      </form>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {/* "Tất cả" */}
        <button
          onClick={() => handleTrangThaiChange("")}
          className={`px-4 py-1.5 text-xs uppercase tracking-widest transition-all border ${
            trangThai === ""
              ? "bg-espresso text-cream border-espresso"
              : "bg-transparent text-stone-600 border-stone-300 hover:border-espresso hover:text-espresso"
          }`}
        >
          Tất cả
        </button>
        {trangThais.map((tt) => (
          <button
            key={tt.key}
            onClick={() => handleTrangThaiChange(tt.key)}
            className={`px-4 py-1.5 text-xs uppercase tracking-widest transition-all border ${
              trangThai === tt.key
                ? "text-white border-transparent"
                : "bg-transparent text-stone-600 border-stone-300 hover:border-espresso hover:text-espresso"
            }`}
            style={trangThai === tt.key ? { backgroundColor: tt.mau, borderColor: tt.mau } : {}}
          >
            {tt.ten}
          </button>
        ))}
      </div>

      {/* Bulk actions bar — chỉ hiện khi có đơn được chọn */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4 px-4 py-3 bg-purple-50 border border-purple-200 rounded-lg">
          <span className="text-xs font-medium text-purple-700">
            Đã chọn {selectedIds.length} đơn
          </span>
          <div className="flex flex-wrap gap-2 ml-auto">
            {/* Chuyển trạng thái hàng loạt */}
            <select
              onChange={(e) => { if (e.target.value) handleBulkStatus(e.target.value as DonHang["trangThai"]); e.target.value = ""; }}
              disabled={bulkLoading}
              defaultValue=""
              className="px-3 py-1.5 border border-purple-300 rounded text-xs text-purple-700 bg-white focus:outline-none cursor-pointer disabled:opacity-50"
            >
              <option value="" disabled>Chuyển trạng thái...</option>
              {trangThais.map((tt) => (
                <option key={tt.key} value={tt.key}>{tt.ten}</option>
              ))}
            </select>

            {/* Export Excel */}
            <button
              onClick={handleExport}
              disabled={exportLoading}
              className="px-4 py-1.5 bg-teal-600 text-white text-xs uppercase tracking-widest hover:bg-teal-700 disabled:opacity-50 transition-colors rounded"
            >
              {exportLoading ? "Đang xuất..." : "Xuất Excel"}
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 border border-stone-300 rounded text-xs text-stone-500 hover:text-espresso"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="md" label="Đang tải..." />
        </div>
      ) : (
        <div className="bg-white border border-stone-300 rounded-xl shadow-md overflow-hidden">
          <OrderTable
            orders={orders}
            selectedIds={selectedIds}
            onSelectChange={setSelectedIds}
            onStatusChange={() => loadOrders(page, trangThai, searchTen, searchSdt, tuNgay, denNgay)}
            onOrderIdClick={(orderId) => setSelectedOrderId(orderId)}
          />
          <div className="px-4">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={(p) => setPage(p)}
              onLimitChange={(l) => { setLimit(l); setPage(1); }}
            />
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onStatusChange={() => loadOrders(page, trangThai, searchTen, searchSdt, tuNgay, denNgay)}
        />
      )}

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => loadOrders(page, trangThai, searchTen, searchSdt, tuNgay, denNgay)}
      />
    </div>
  );
}
