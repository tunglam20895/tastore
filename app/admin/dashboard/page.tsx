"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useAdminChat } from "@/contexts/AdminChatContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, Legend, CartesianGrid, Line,
} from "recharts";
import LoadingSpinner from "@/components/LoadingSpinner";

// ─── Types ────────────────────────────────────────────────────────────────────
type ThongKe = {
  doanhThu: {
    homNay: number;
    thangNay: number;
    thangTruoc: number;
    tongCong: number;
    phanTramTangTruong: number | null;
  };
  donHang: {
    tongCong: number;
    homNay: number;
    moiChua: number;
    choTotLenDon: number;
    daLenDon: number;
    dangXuLy: number;
    daGiao: number;
    huy: number;
    tiLeHuy: number;
  };
  donTheoNhanVien: { ten: string; soDon: number; doanhThu: number }[];
  khachHang: {
    tongSo: number;
    tongDoanhThu: number;
    topKhachHang: { ten: string; sdt: string; tongDon: number; tongDoanhThu: number }[];
  };
  nhanVien: {
    tongSo: number;
    conHoatDong: number;
    tongLuongChiTra: number;
  };
  sanPham: {
    dangBan: number;
    hetHang: number;
    topBanChay: { ten: string; soLuong: number }[];
    topDanhMuc: { ten: string; soLuong: number }[];
  };
  tracking: {
    homNay: number;
    thangNay: number;
    tongCong: number;
    chartData: { ngay: string; luot: number }[];
  };
  donHangChart: { ngay: string; don: number }[];
  chartTheoThang: { thang: string; doanhThu: number; soDon: number }[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}
function fmtCompact(n: number) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace('.0', '') + ' tỷ';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + ' tr';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k';
  return new Intl.NumberFormat("vi-VN").format(n);
}
function fmtNum(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}
function formatDateISO(d: string) {
  return d.slice(0, 10);
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function firstDayOfMonthISO() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function Skel({ className = "" }: { className?: string }) {
  return <div className={`bg-blush/40 animate-pulse rounded ${className}`} />;
}

// ─── KPI Card (large, row 1) ─────────────────────────────────────────────────
function KpiCard({
  label, value, sub, accent = "border-stone-300", icon, loading,
}: {
  label: string; value: string; sub?: string; accent?: string; icon?: React.ReactNode; loading: boolean;
}) {
  return (
    <div className={`bg-white border border-stone-300 rounded-xl p-4 sm:p-5 shadow-md relative overflow-hidden`}>
      <div className={`absolute top-0 left-0 right-0 h-1 ${accent}`} />
      <div className="flex items-start justify-between mb-2">
        <p className="text-[10px] uppercase tracking-widest text-stone-600 font-semibold">{label}</p>
        {icon && <span className="opacity-30 text-2xl">{icon}</span>}
      </div>
      {loading ? (
        <>
          <Skel className="h-8 w-3/4 mb-2" />
          <Skel className="h-3 w-1/2" />
        </>
      ) : (
        <>
          <p className="font-sans text-xl sm:text-2xl font-bold text-espresso leading-none mb-1.5 tabular-nums">{value}</p>
          {sub && <p className="text-[10px] sm:text-xs text-stone-500">{sub}</p>}
        </>
      )}
    </div>
  );
}

// ─── Small stat card (row 2) ─────────────────────────────────────────────────
function StatCard({
  label, value, color = "text-espresso", loading, bg = "bg-white",
}: {
  label: string; value: string; color?: string; loading: boolean; bg?: string;
}) {
  return (
    <div className={`${bg} border border-stone-200 rounded-lg p-3`}>
      <p className="text-[9px] uppercase tracking-wider text-stone-500 font-semibold mb-1">{label}</p>
      {loading ? <Skel className="h-5 w-2/3" /> : (
        <p className={`font-sans text-base sm:text-lg font-bold leading-none tabular-nums ${color}`}>{value}</p>
      )}
    </div>
  );
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, donVi = "lượt" }: {
  active?: boolean; payload?: { value: number; dataKey: string; name: string }[]; label?: string; donVi?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-espresso text-cream text-xs px-3 py-2 rounded-lg shadow-lg border border-blush/20">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex justify-between gap-4">
          <span className="text-cream/70">{p.name}:</span>
          <span className="font-semibold">
            {p.dataKey === "doanhThu" || p.dataKey === "lương" || p.dataKey === "lợi nhuận"
              ? fmt(p.value)
              : `${fmtNum(p.value)} ${donVi}`}
          </span>
        </p>
      ))}
    </div>
  );
}

// ─── Section title ───────────────────────────────────────────────────────────
function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3 sm:mb-4">
      <h2 className="text-xs uppercase tracking-widest text-stone-600 font-semibold">
        {children}
      </h2>
      {right && <div>{right}</div>}
    </div>
  );
}

// ─── Color palette ───────────────────────────────────────────────────────────
const COLORS = ["#C8A991", "#A8705F", "#8C7B72", "#4a3028", "#1A0A04", "#6B7280"];

function ChartGradients() {
  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }}>
      <defs>
        <linearGradient id="blushGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C8A991" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#C8A991" stopOpacity={0.5} />
        </linearGradient>
        <linearGradient id="espressoGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A8705F" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#A8705F" stopOpacity={0.5} />
        </linearGradient>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C8A991" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#C8A991" stopOpacity={0.02} />
        </linearGradient>
        <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A8705F" stopOpacity={0.25} />
          <stop offset="100%" stopColor="#A8705F" stopOpacity={0.02} />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState<ThongKe | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Date filter
  const [tuNgay, setTuNgay] = useState(() => firstDayOfMonthISO());
  const [denNgay, setDenNgay] = useState(() => todayISO());

  const adminPassword =
    typeof window !== "undefined" ? localStorage.getItem("admin-password") : "";

  const hasFilterRef = useRef(false);

  const load = useCallback((initialLoad = false, signal?: AbortSignal) => {
    const minLoading = initialLoad
      ? new Promise<void>((resolve) => setTimeout(resolve, 600))
      : Promise.resolve();

    const params = new URLSearchParams();
    if (hasFilterRef.current) {
      params.set("tu_ngay", tuNgay);
      params.set("den_ngay", denNgay);
    }

    Promise.all([
      fetch(`/api/thong-ke?${params}`, {
        headers: { "x-admin-password": adminPassword || "" },
        signal,
      }).then((r) => r.json()),
      minLoading,
    ]).then(([res]) => {
        if (res.success) {
          setData(res.data);
          setLastUpdate(new Date());
        }
      })
      .catch((err) => { if (err.name !== "AbortError") {} })
      .finally(() => setLoading(false));
  }, [adminPassword, tuNgay, denNgay]);

  useEffect(() => {
    const controller = new AbortController();
    load(true, controller.signal);
    const interval = setInterval(() => {
      const c = new AbortController();
      load(false, c.signal);
    }, 60_000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const d = data;

  // ─── Push data to AdminChat context ────────────────────────────────────────
  const { setScreenData } = useAdminChat();

  useEffect(() => {
    if (data && !loading) {
      setScreenData({
        page: 'dashboard',
        title: 'Dashboard — Thống kê tổng quan',
        summary: 'Trang dashboard hiển thị thống kê doanh thu, đơn hàng, khách hàng, nhân viên và tồn kho của shop.',
        stats: {
          'Doanh thu hôm nay': data.doanhThu.homNay,
          'Doanh thu tháng này': data.doanhThu.thangNay,
          'Doanh thu tháng trước': data.doanhThu.thangTruoc,
          'Tăng trưởng': data.doanhThu.phanTramTangTruong !== null ? `${data.doanhThu.phanTramTangTruong > 0 ? '+' : ''}${data.doanhThu.phanTramTangTruong}%` : 'N/A',
          'Đơn hôm nay': data.donHang.homNay,
          'Lượt truy cập hôm nay': data.tracking.homNay,
          'Tổng khách hàng': data.khachHang.tongSo,
          'Tổng nhân viên': data.nhanVien.tongSo,
          'Sản phẩm đang bán': data.sanPham.dangBan,
          'Sản phẩm hết hàng': data.sanPham.hetHang,
        },
        items: data.donTheoNhanVien.map(nv => `${nv.ten}: ${nv.soDon} đơn (${fmt(nv.doanhThu)})`),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.doanhThu, data?.donHang, data?.khachHang, data?.nhanVien, data?.sanPham, data?.tracking, data?.donTheoNhanVien, loading]);

  const tong = (d?.sanPham.dangBan ?? 0) + (d?.sanPham.hetHang ?? 0);
  const pctDangBan = tong === 0 ? 0 : Math.round(((d?.sanPham.dangBan ?? 0) / tong) * 100);

  const growth = d?.doanhThu.phanTramTangTruong;
  const growthColor = growth == null ? "text-stone-400"
      : growth > 0 ? "text-green-600" : growth < 0 ? "text-rose" : "text-stone-400";
  const growthText = growth == null ? "N/A"
      : growth > 0 ? `+${growth}%` : `${growth}%`;

  // ─── Derived: Lợi nhuận ước tính (doanh thu tháng này - lương chi trả) ────
  const loiNhuanUocTinh = (d?.doanhThu.thangNay ?? 0) - (d?.nhanVien.tongLuongChiTra ?? 0);
  const tyLeLuong = d?.doanhThu.thangNay
    ? Math.round(((d.nhanVien.tongLuongChiTra ?? 0) / d.doanhThu.thangNay) * 100)
    : 0;
  const luongTB = d?.nhanVien.conHoatDong
    ? Math.round((d.nhanVien.tongLuongChiTra ?? 0) / d.nhanVien.conHoatDong)
    : 0;

  const handleApplyFilter = () => {
    if (!tuNgay || !denNgay) return;
    hasFilterRef.current = true;
    load(false);
  };

  const handleClearFilter = () => {
    setTuNgay(firstDayOfMonthISO());
    setDenNgay(todayISO());
    hasFilterRef.current = false;
    load(false);
  };

  // ─── Memo: chart data for monthly revenue line ────
  // ─── Memo: top 5 orders by staff for chart ────
  const topStaffData = useMemo(() => {
    return (d?.donTheoNhanVien ?? []).slice(0, 6).map((nv) => ({
      ten: nv.ten.length > 12 ? nv.ten.slice(0, 12) + "…" : nv.ten,
      soDon: nv.soDon,
      doanhThu: nv.doanhThu,
    }));
  }, [d?.donTheoNhanVien]);

  // Full-page loading on initial load
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <LoadingSpinner size="full" label="Đang tải dữ liệu..." />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <ChartGradients />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl sm:text-2xl font-light text-espresso tracking-wider">Dashboard</h1>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-[10px] text-stone-600 font-medium tracking-wider">
              Cập nhật: {lastUpdate.toLocaleTimeString("vi-VN")}
            </span>
          )}
          <button
            onClick={() => load(false)}
            className="text-[10px] uppercase tracking-widest text-stone-600 font-medium hover:text-espresso transition-colors"
          >
            Làm mới
          </button>
        </div>
      </div>

      {/* ── Date Filter ── */}
      <div className="bg-white border border-stone-200 rounded-xl px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-400">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-xs font-semibold text-espresso tracking-wider">Khoảng ngày</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-500">Từ</span>
            <input
              type="date"
              value={tuNgay}
              onChange={(e) => setTuNgay(e.target.value)}
              className="px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs text-espresso font-medium focus:outline-none focus:border-blush focus:ring-1 focus:ring-blush/30 bg-white"
            />
          </div>
          <span className="text-stone-300 text-xs">→</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-500">Đến</span>
            <input
              type="date"
              value={denNgay}
              onChange={(e) => setDenNgay(e.target.value)}
              className="px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs text-espresso font-medium focus:outline-none focus:border-blush focus:ring-1 focus:ring-blush/30 bg-white"
            />
          </div>
          <button
            onClick={handleApplyFilter}
            className="px-4 py-1.5 bg-espresso text-cream text-[10px] font-semibold uppercase tracking-wider hover:opacity-80 transition-opacity rounded-lg"
          >
            Áp dụng
          </button>
          {hasFilterRef.current && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[10px] text-rose font-medium bg-rose-50 px-2 py-0.5 rounded">
                {formatDateISO(tuNgay)} → {formatDateISO(denNgay)}
              </span>
              <button
                onClick={handleClearFilter}
                className="px-2.5 py-1.5 border border-stone-200 rounded-lg text-[10px] font-medium text-stone-500 hover:text-espresso hover:border-espresso transition-colors"
              >
                Xóa lọc
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 1: 4 KPI lớn ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Doanh thu tháng"
          value={d ? fmt(d.doanhThu.thangNay) : "—"}
          sub={`Tháng trước: ${d ? fmtCompact(d.doanhThu.thangTruoc) : "—"}`}
          accent="bg-espresso"
          icon="💰"
          loading={loading}
        />
        <KpiCard
          label="Đơn hôm nay"
          value={d ? fmtNum(d.donHang.homNay) : "—"}
          sub={`Tổng: ${d ? fmtNum(d.donHang.tongCong) : "—"} đơn`}
          accent="bg-rose"
          icon="📦"
          loading={loading}
        />
        <KpiCard
          label="Lượt truy cập"
          value={d ? fmtNum(d.tracking.homNay) : "—"}
          sub={`Tháng: ${d ? fmtNum(d.tracking.thangNay) : "—"}`}
          accent="bg-blush"
          icon="👁"
          loading={loading}
        />
        <KpiCard
          label="Sản phẩm đang bán"
          value={d ? fmtNum(d.sanPham.dangBan) : "—"}
          sub={`Hết hàng: ${d ? fmtNum(d.sanPham.hetHang) : "—"}`}
          accent="bg-stone-400"
          icon=""
          loading={loading}
        />
      </div>

      {/* ── ROW 2: small stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
        <StatCard label="Doanh thu hôm nay" value={d ? fmtCompact(d.doanhThu.homNay) : "—"} loading={loading} />
        <StatCard label="Doanh thu T trước" value={d ? fmtCompact(d.doanhThu.thangTruoc) : "—"} loading={loading} />
        <StatCard label="Tăng trưởng" value={growthText} color={growthColor} loading={loading} />
        <StatCard label="Tổng doanh thu" value={d ? fmtCompact(d.doanhThu.tongCong) : "—"} loading={loading} />
        <StatCard label="Đơn mới" value={d ? fmtNum(d.donHang.moiChua) : "—"} color="text-blue-600" loading={loading} bg="bg-blue-50/50" />
        <StatCard label="Chốt lên đơn" value={d ? fmtNum(d.donHang.choTotLenDon) : "—"} color="text-purple-600" loading={loading} bg="bg-purple-50/50" />
        <StatCard label="Đang xử lý" value={d ? fmtNum(d.donHang.dangXuLy) : "—"} color="text-amber-600" loading={loading} bg="bg-amber-50/50" />
        <StatCard label={`Huỷ (${d?.donHang.tiLeHuy ?? 0}%)`} value={d ? fmtNum(d.donHang.huy) : "—"} color="text-rose" loading={loading} bg="bg-rose-50/50" />
      </div>

      {/* ── ROW 3: Charts - 7 ngày ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lượt truy cập 7 ngày — Area chart */}
        <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-sm">
          <SectionTitle>Lượt truy cập (7 ngày)</SectionTitle>
          {loading ? (
            <Skel className="h-60 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={d?.tracking.chartData ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe4" />
                <XAxis dataKey="ngay" tick={{ fontSize: 10, fill: '#a89585' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#a89585' }} axisLine={false} tickLine={false} width={35} />
                <Tooltip content={<CustomTooltip donVi="lượt" />} />
                <Area type="monotone" dataKey="luot" stroke="#C8A991" fill="url(#areaGrad)" strokeWidth={2} dot={{ r: 3, fill: "#C8A991", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#C8A991", stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Đơn hàng 7 ngày — Area chart */}
        <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-sm">
          <SectionTitle>Đơn hàng (7 ngày)</SectionTitle>
          {loading ? (
            <Skel className="h-60 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={d?.donHangChart ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe4" />
                <XAxis dataKey="ngay" tick={{ fontSize: 10, fill: '#a89585' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#a89585' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<CustomTooltip donVi="đơn" />} />
                <Area type="monotone" dataKey="don" stroke="#A8705F" fill="url(#areaGrad2)" strokeWidth={2} dot={{ r: 3, fill: "#A8705F", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#A8705F", stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── ROW 3.5: Charts - 7 tháng (Line + Bar combo) ── */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-sm">
        <SectionTitle>
          Thống kê theo tháng (7 tháng gần nhất)
          {d?.doanhThu.phanTramTangTruong != null && (
            <span className={`text-[10px] font-medium ${growthColor}`}>
              {growthText} so với tháng trước
            </span>
          )}
        </SectionTitle>
        {loading ? (
          <Skel className="h-72 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={d?.chartTheoThang ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe4" vertical={false} />
              <XAxis dataKey="thang" tick={{ fontSize: 10, fill: '#a89585' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#a89585' }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => fmtCompact(v)} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#a89585' }} axisLine={false} tickLine={false} width={35} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="doanhThu" name="Doanh thu" radius={[6, 6, 0, 0]} barSize={40}>
                {(d?.chartTheoThang ?? []).map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Bar>
              <Line yAxisId="right" type="monotone" dataKey="soDon" name="Số đơn" stroke="#A8705F" strokeWidth={2} dot={{ r: 4, fill: "#A8705F", stroke: "#fff", strokeWidth: 2 }} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── ROW 4: Đơn hàng theo trạng thái + Theo nhân viên ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Đơn hàng theo trạng thái */}
        <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-sm">
          <SectionTitle>Đơn hàng theo trạng thái</SectionTitle>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <Skel key={i} className="h-8 w-full" />)}
            </div>
          ) : (
            <div className="space-y-2.5">
              {[
                { label: "Mới", count: d?.donHang.moiChua ?? 0, color: "bg-blue-500", text: "text-blue-600", bgLight: "bg-blue-50" },
                { label: "Chốt để lên đơn", count: d?.donHang.choTotLenDon ?? 0, color: "bg-purple-500", text: "text-purple-600", bgLight: "bg-purple-50" },
                { label: "Đã lên đơn", count: d?.donHang.daLenDon ?? 0, color: "bg-teal-500", text: "text-teal-600", bgLight: "bg-teal-50" },
                { label: "Đang xử lý", count: d?.donHang.dangXuLy ?? 0, color: "bg-amber-500", text: "text-amber-600", bgLight: "bg-amber-50" },
                { label: "Đã giao", count: d?.donHang.daGiao ?? 0, color: "bg-green-500", text: "text-green-600", bgLight: "bg-green-50" },
                { label: "Huỷ", count: d?.donHang.huy ?? 0, color: "bg-rose", text: "text-rose", bgLight: "bg-rose/10" },
              ].map((stt) => {
                const max = d ? Math.max(1, ...[
                  d.donHang.moiChua, d.donHang.choTotLenDon, d.donHang.daLenDon,
                  d.donHang.dangXuLy, d.donHang.daGiao, d.donHang.huy,
                ]) : 1;
                const pct = Math.round((stt.count / max) * 100);
                const pctTotal = d ? Math.round((stt.count / Math.max(1, d.donHang.tongCong)) * 100) : 0;
                return (
                  <div key={stt.label} className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${stt.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-espresso font-medium">{stt.label}</span>
                        <span className={`${stt.text} font-semibold ml-2 shrink-0 tabular-nums`}>
                          {fmtNum(stt.count)}
                          <span className="text-stone-500 font-normal ml-1">({pctTotal}%)</span>
                        </span>
                      </div>
                      <div className={`h-2 ${stt.bgLight} rounded-full overflow-hidden`}>
                        <div
                          className={`h-full rounded-full transition-all ${stt.color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Đơn hàng theo nhân viên — Horizontal bar chart */}
        <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-sm">
          <SectionTitle>Đơn hàng theo nhân viên</SectionTitle>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skel key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div>
              {topStaffData.length > 0 ? (
                <ResponsiveContainer width="100%" height={Math.max(200, topStaffData.length * 50)}>
                  <BarChart
                    data={topStaffData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe4" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#a89585' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="ten" tick={{ fontSize: 10, fill: '#7a5a4e', fontWeight: 500 }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0].payload;
                        return (
                          <div className="bg-espresso text-cream text-xs px-3 py-2 rounded-lg shadow-lg">
                            <p className="font-medium mb-1">{label}</p>
                            <p>{fmtNum(item.soDon)} đơn · {fmt(item.doanhThu)}</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="soDon" name="Số đơn" radius={[0, 4, 4, 0]} barSize={24}>
                      {topStaffData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-stone-500 py-8 text-center">Chưa có dữ liệu</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 5: Khách hàng + Nhân viên & Chi phí lương ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Khách hàng */}
        <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-sm">
          <SectionTitle>Khách hàng & Doanh thu từ KH</SectionTitle>
          {loading ? (
            <div className="space-y-3">
              <Skel className="h-14" />
              {Array.from({ length: 4 }).map((_, i) => <Skel key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <div>
              {/* Summary row */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-gradient-to-br from-cream/80 to-cream rounded-lg p-3 text-center border border-stone-100">
                  <p className="font-sans text-2xl font-bold text-espresso tabular-nums">
                    {fmtNum(d?.khachHang.tongSo ?? 0)}
                  </p>
                  <p className="text-[9px] uppercase tracking-widest text-stone-500 mt-1">Tổng khách hàng</p>
                </div>
                <div className="bg-gradient-to-br from-rose-50 to-cream rounded-lg p-3 text-center border border-stone-100">
                  <p className="font-sans text-2xl font-bold text-rose tabular-nums">
                    {fmt(d?.khachHang.tongDoanhThu ?? 0)}
                  </p>
                  <p className="text-[9px] uppercase tracking-widest text-stone-500 mt-1">Doanh thu từ KH</p>
                </div>
              </div>
              {/* Top KH */}
              <p className="text-[9px] uppercase tracking-widest text-stone-600 mb-2">Top khách hàng</p>
              <div className="space-y-2">
                {(d?.khachHang.topKhachHang ?? []).map((kh, i) => {
                  const maxDt = d ? Math.max(1, ...(d.khachHang.topKhachHang ?? []).map((k) => k.tongDoanhThu)) : 1;
                  const pct = Math.round((kh.tongDoanhThu / maxDt) * 100);
                  const medals = ["🥇", "🥈", "🥉"];
                  return (
                    <div key={kh.sdt} className="flex items-center gap-2.5">
                      <span className="text-xs shrink-0">{medals[i] || `#${i + 1}`}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-espresso font-medium truncate">{kh.ten}</span>
                          <span className="text-stone-500 ml-2 shrink-0 tabular-nums text-[10px]">{kh.tongDon} đơn</span>
                        </div>
                        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blush to-espresso rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-medium text-espresso shrink-0 tabular-nums min-w-[80px] text-right">
                        {fmt(kh.tongDoanhThu)}
                      </span>
                    </div>
                  );
                })}
                {(!d?.khachHang.topKhachHang || d.khachHang.topKhachHang.length === 0) && (
                  <p className="text-xs text-stone-400 py-4 text-center">Chưa có dữ liệu</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Nhân viên & Tổng lương — MUCH richer */}
        <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-sm">
          <SectionTitle>Nhân viên & Chi phí lương</SectionTitle>
          {loading ? (
            <div className="space-y-3">
              <Skel className="h-20" />
              <div className="grid grid-cols-2 gap-4">
                <Skel className="h-20" />
                <Skel className="h-20" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Top metrics row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-emerald-50 to-cream rounded-lg p-3 text-center border border-emerald-100/50">
                  <p className="font-sans text-lg font-bold text-emerald-700 tabular-nums">
                    {fmtNum(d?.nhanVien.conHoatDong ?? 0)}
                  </p>
                  <p className="text-[9px] uppercase tracking-widest text-emerald-600/60 mt-1">Đang hoạt động</p>
                </div>
                <div className="bg-gradient-to-br from-blush/30 to-cream rounded-lg p-3 text-center border border-stone-100">
                  <p className="font-sans text-lg font-bold text-espresso tabular-nums">
                    {d ? fmtCompact(d.nhanVien.tongLuongChiTra) : "—"}
                  </p>
                  <p className="text-[9px] uppercase tracking-widest text-stone-500 mt-1">Tổng lương</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-cream rounded-lg p-3 text-center border border-amber-100/50">
                  <p className="font-sans text-lg font-bold text-amber-700 tabular-nums">
                    {d ? fmtCompact(luongTB) : "—"}
                  </p>
                  <p className="text-[9px] uppercase tracking-widest text-amber-600/60 mt-1">Lương TB / NV</p>
                </div>
              </div>

              {/* Profit & cost ratio */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-lg p-3 border ${loiNhuanUocTinh >= 0 ? 'bg-green-50 border-green-200/50' : 'bg-rose-50 border-rose-200/50'}`}>
                  <p className="text-[9px] uppercase tracking-widest text-stone-600 mb-1">Lợi nhuận ước tính</p>
                  <p className={`font-sans text-base font-bold tabular-nums ${loiNhuanUocTinh >= 0 ? 'text-green-700' : 'text-rose'}`}>
                    {fmt(loiNhuanUocTinh)}
                  </p>
                  <p className="text-[9px] text-stone-500 mt-0.5">Doanh thu T này − Tổng lương</p>
                </div>
                <div className="bg-stone-50 rounded-lg p-3 border border-stone-100">
                  <p className="text-[9px] uppercase tracking-widest text-stone-600 mb-1">Tỉ lệ chi lương</p>
                  <p className="font-sans text-base font-bold text-espresso tabular-nums">
                    {tyLeLuong}%
                  </p>
                  <div className="mt-1.5 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${tyLeLuong > 50 ? 'bg-rose' : tyLeLuong > 30 ? 'bg-amber-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(tyLeLuong, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Staff list with salary breakdown */}
              {topStaffData.length > 0 && (
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-stone-600 mb-2">Top nhân viên theo doanh thu</p>
                  <div className="space-y-1.5">
                    {topStaffData.map((nv, i) => (
                      <div key={nv.ten} className="flex items-center gap-2.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-cream shrink-0 ${COLORS[i % COLORS.length].includes('C8A9') ? 'bg-espresso' : 'bg-stone-600'}`}>
                          {(nv.ten[0] || "?").toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-xs">
                            <span className="text-espresso font-medium truncate">{nv.ten}</span>
                            <span className="text-stone-500 shrink-0 tabular-nums text-[10px]">{fmtNum(nv.soDon)} đơn</span>
                          </div>
                          <div className="h-1 bg-stone-100 rounded-full overflow-hidden mt-0.5">
                            <div
                              className="h-full bg-blush rounded-full transition-all"
                              style={{ width: `${topStaffData.length > 0 ? Math.round((nv.doanhThu / Math.max(1, topStaffData[0].doanhThu)) * 100) : 0}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs font-medium text-espresso shrink-0 tabular-nums min-w-[70px] text-right">
                          {fmt(nv.doanhThu)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 6: Sản phẩm & Tồn kho ── */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-sm">
        <SectionTitle>Tổng quan kho hàng</SectionTitle>
        {loading ? (
          <div className="space-y-3">
            <Skel className="h-8 w-full" />
            {Array.from({ length: 5 }).map((_, i) => <Skel key={i} className="h-6 w-full" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overall stock bar */}
            <div className="flex items-center gap-4">
              <span className="text-xs text-stone-500 shrink-0 font-medium">Kho hàng</span>
              <div className="flex-1 h-3 bg-stone-100 rounded-full overflow-hidden flex">
                {tong > 0 && (
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all"
                    style={{ width: `${pctDangBan}%` }}
                    title={`Đang bán: ${d?.sanPham.dangBan ?? 0}`}
                  />
                )}
                {tong > 0 && (
                  <div
                    className="h-full bg-rose transition-all"
                    style={{ width: `${100 - pctDangBan}%` }}
                    title={`Hết hàng: ${d?.sanPham.hetHang ?? 0}`}
                  />
                )}
              </div>
              <span className="text-xs text-stone-500 shrink-0 tabular-nums font-medium">
                {fmtNum(tong)} sp
              </span>
            </div>

            {/* Top sản phẩm + Top danh mục side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Top sản phẩm */}
              {(d?.sanPham.topBanChay ?? []).length > 0 && (
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-stone-600 mb-2">🏆 Top sản phẩm bán chạy</p>
                  <div className="space-y-2">
                    {(d?.sanPham.topBanChay ?? []).map((sp, i) => (
                      <div key={sp.ten} className="flex items-center gap-3 text-xs">
                        <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-cream shrink-0 ${i === 0 ? 'bg-espresso' : i === 1 ? 'bg-rose' : 'bg-blush'}`}>
                          {i + 1}
                        </span>
                        <span className="flex-1 truncate text-espresso font-medium">{sp.ten}</span>
                        <span className="text-stone-500 tabular-nums">{fmtNum(sp.soLuong)} cái</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top danh mục */}
              {(d?.sanPham.topDanhMuc ?? []).length > 0 && (
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-stone-600 mb-2">📂 Top danh mục</p>
                  <div className="space-y-2">
                    {(d?.sanPham.topDanhMuc ?? []).map((dm, i) => (
                      <div key={dm.ten} className="flex items-center gap-3 text-xs">
                        <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-cream shrink-0 ${i === 0 ? 'bg-espresso' : i === 1 ? 'bg-rose' : 'bg-blush'}`}>
                          {i + 1}
                        </span>
                        <span className="flex-1 truncate text-espresso font-medium">{dm.ten}</span>
                        <span className="text-stone-500 tabular-nums">{fmtNum(dm.soLuong)} cái</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
