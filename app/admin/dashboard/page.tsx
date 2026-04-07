"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

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
    dangXuLy: number;
    daGiao: number;
    huy: number;
    tiLeHuy: number;
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
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}
function fmtNum(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function Skel({ className = "" }: { className?: string }) {
  return <div className={`bg-blush/40 animate-pulse rounded ${className}`} />;
}

// ─── KPI Card (large, row 1) ─────────────────────────────────────────────────
function KpiCard({
  label, value, sub, accent = "border-stone-300", loading,
}: {
  label: string; value: string; sub?: string; accent?: string; loading: boolean;
}) {
  return (
    <div className={`bg-white border border-stone-300 rounded-xl p-6 border-t-4 ${accent} shadow-md`}>
      <p className="text-xs uppercase tracking-widest text-stone-500 font-medium mb-3">{label}</p>
      {loading ? (
        <>
          <Skel className="h-9 w-3/4 mb-2" />
          <Skel className="h-3 w-1/2" />
        </>
      ) : (
        <>
          <p className="font-sans text-2xl font-bold text-espresso leading-none mb-2 tabular-nums">{value}</p>
          {sub && <p className="text-xs text-stone-500">{sub}</p>}
        </>
      )}
    </div>
  );
}

// ─── Small stat card (row 2) ─────────────────────────────────────────────────
function StatCard({
  label, value, color = "text-espresso", loading,
}: {
  label: string; value: string; color?: string; loading: boolean;
}) {
  return (
    <div className="bg-white border border-stone-300 rounded-xl p-4 shadow-md">
      <p className="text-[10px] uppercase tracking-widest text-stone-600 font-medium mb-2">{label}</p>
      {loading ? <Skel className="h-7 w-2/3" /> : (
        <p className={`font-sans text-xl font-bold leading-none tabular-nums ${color}`}>{value}</p>
      )}
    </div>
  );
}

// ─── Custom Tooltip recharts ──────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, donVi = "lượt" }: {
  active?: boolean; payload?: { value: number }[]; label?: string; donVi?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-espresso text-cream text-xs px-3 py-2 rounded shadow-lg">
      <p className="font-medium">{label}</p>
      <p>{fmtNum(payload[0].value)} {donVi}</p>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState<ThongKe | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const adminPassword =
    typeof window !== "undefined" ? localStorage.getItem("admin-password") : "";

  const load = useCallback(() => {
    fetch("/api/thong-ke", {
      headers: { "x-admin-password": adminPassword || "" },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setData(res.data);
          setLastUpdate(new Date());
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminPassword]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  const d = data;
  const tong = (d?.sanPham.dangBan ?? 0) + (d?.sanPham.hetHang ?? 0);
  const pctDangBan = tong === 0 ? 0 : Math.round(((d?.sanPham.dangBan ?? 0) / tong) * 100);

  const growth = d?.doanhThu.phanTramTangTruong;
  const growthColor = growth == null ? "text-stone-400"
      : growth > 0 ? "text-green-600" : growth < 0 ? "text-rose" : "text-stone-400";
  const growthText = growth == null ? "N/A"
      : growth > 0 ? `+${growth}%` : `${growth}%`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-light text-espresso">Dashboard</h1>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-xs text-stone-400">
              Cập nhật: {lastUpdate.toLocaleTimeString("vi-VN")}
            </span>
          )}
          <button
            onClick={load}
            className="text-xs uppercase tracking-widest text-stone-400 hover:text-espresso transition-colors"
          >
            Làm mới
          </button>
        </div>
      </div>

      {/* ── ROW 1: 4 KPI lớn ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Doanh thu tháng này"
          value={d ? fmt(d.doanhThu.thangNay) : "—"}
          sub={`Tháng trước: ${d ? fmt(d.doanhThu.thangTruoc) : "—"}`}
          accent="border-espresso"
          loading={loading}
        />
        <KpiCard
          label="Đơn hôm nay"
          value={d ? fmtNum(d.donHang.homNay) : "—"}
          sub={`Tổng: ${d ? fmtNum(d.donHang.tongCong) : "—"} đơn`}
          accent="border-rose"
          loading={loading}
        />
        <KpiCard
          label="Lượt truy cập hôm nay"
          value={d ? fmtNum(d.tracking.homNay) : "—"}
          sub={`Tổng: ${d ? fmtNum(d.tracking.tongCong) : "—"} • Tháng: ${d ? fmtNum(d.tracking.thangNay) : "—"}`}
          accent="border-stone-400"
          loading={loading}
        />
        <KpiCard
          label="Sản phẩm đang bán"
          value={d ? fmtNum(d.sanPham.dangBan) : "—"}
          sub={`Hết hàng: ${d ? fmtNum(d.sanPham.hetHang) : "—"} sp`}
          accent="border-stone-300"
          loading={loading}
        />
      </div>

      {/* ── ROW 2: small stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard label="Doanh thu hôm nay" value={d ? fmt(d.doanhThu.homNay) : "—"} loading={loading} />
        <StatCard label="Doanh thu tháng trước" value={d ? fmt(d.doanhThu.thangTruoc) : "—"} loading={loading} />
        <StatCard label="Tăng trưởng" value={growthText} color={growthColor} loading={loading} />
        <StatCard label="Tổng doanh thu" value={d ? fmt(d.doanhThu.tongCong) : "—"} loading={loading} />
        <StatCard label="Đơn đang xử lý" value={d ? fmtNum(d.donHang.dangXuLy) : "—"} color="text-amber-600" loading={loading} />
        <StatCard label="Đơn mới chưa xem" value={d ? fmtNum(d.donHang.moiChua) : "—"} color="text-blue-600" loading={loading} />
        <StatCard label="Đã giao" value={d ? fmtNum(d.donHang.daGiao) : "—"} color="text-green-600" loading={loading} />
        <StatCard label={`Đơn huỷ (${d?.donHang.tiLeHuy ?? 0}%)`} value={d ? fmtNum(d.donHang.huy) : "—"} color="text-rose" loading={loading} />
      </div>

      {/* ── ROW 3: 2 biểu đồ ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lượt truy cập 7 ngày */}
        <div className="bg-white border border-stone-300 rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs uppercase tracking-widest text-stone-500 font-medium">
              Lượt truy cập 7 ngày qua
            </h2>
            <span className="text-xs text-stone-500 font-medium tabular-nums">
              Tổng: {d ? fmtNum(d.tracking.tongCong) : "—"}
            </span>
          </div>
          {loading ? (
            <Skel className="h-44 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={d?.tracking.chartData || []} barSize={24}>
                <XAxis dataKey="ngay" tick={{ fontSize: 11, fill: "#5E4E46" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#5E4E46" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<CustomTooltip donVi="lượt" />} cursor={{ fill: "#EDE8DF" }} />
                <Bar dataKey="luot" radius={[4, 4, 0, 0]}>
                  {(d?.tracking.chartData || []).map((_, i, arr) => (
                    <Cell key={i} fill={i === arr.length - 1 ? "#1A0A04" : "#C8A991"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Đơn hàng 7 ngày */}
        <div className="bg-white border border-stone-300 rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs uppercase tracking-widest text-stone-500 font-medium">
              Đơn hàng 7 ngày qua
            </h2>
            <span className="text-xs text-stone-500 font-medium tabular-nums">
              Tổng: {d ? fmtNum(d.donHang.tongCong) : "—"} đơn
            </span>
          </div>
          {loading ? (
            <Skel className="h-44 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={d?.donHangChart || []} barSize={24}>
                <XAxis dataKey="ngay" tick={{ fontSize: 11, fill: "#5E4E46" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#5E4E46" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<CustomTooltip donVi="đơn" />} cursor={{ fill: "#EDE8DF" }} />
                <Bar dataKey="don" radius={[4, 4, 0, 0]}>
                  {(d?.donHangChart || []).map((_, i, arr) => (
                    <Cell key={i} fill={i === arr.length - 1 ? "#1A0A04" : "#A8705F"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── ROW 4: Bán chạy + Danh mục ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top sản phẩm bán chạy */}
        <div className="bg-white border border-stone-300 rounded-xl p-6 shadow-md">
          <h2 className="text-xs uppercase tracking-widest text-stone-500 font-medium mb-5">
            Sản phẩm bán chạy nhất
          </h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skel key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {(d?.sanPham.topBanChay || []).map((sp, i) => {
                const max = d?.sanPham.topBanChay[0]?.soLuong || 1;
                const pct = Math.round((sp.soLuong / max) * 100);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-stone-300 w-4 text-right shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-espresso font-medium truncate">{sp.ten}</span>
                        <span className="text-stone-500 ml-2 shrink-0">{fmtNum(sp.soLuong)} sp</span>
                      </div>
                      <div className="h-1.5 bg-blush rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: i === 0 ? "#2C1A12" : i === 1 ? "#C9A99A" : "#E8D5C4",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!d?.sanPham.topBanChay || d.sanPham.topBanChay.length === 0) && (
                <p className="text-xs text-stone-500 py-4 text-center">Chưa có dữ liệu</p>
              )}
            </div>
          )}
        </div>

        {/* Top danh mục */}
        <div className="bg-white border border-stone-300 rounded-xl p-6 shadow-md">
          <h2 className="text-xs uppercase tracking-widest text-stone-500 font-medium mb-5">
            Danh mục bán chạy nhất
          </h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skel key={i} className="h-14 w-full" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {(d?.sanPham.topDanhMuc || []).map((dm, i) => {
                const max = d?.sanPham.topDanhMuc[0]?.soLuong || 1;
                const pct = Math.round((dm.soLuong / max) * 100);
                const colors = ["bg-espresso", "bg-rose", "bg-blush"];
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center text-sm mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${colors[i]}`} />
                        <span className="text-espresso font-medium">{dm.ten}</span>
                      </div>
                      <span className="text-stone-500 text-xs">{fmtNum(dm.soLuong)} đã bán</span>
                    </div>
                    <div className="h-2 bg-blush rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${colors[i]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {(!d?.sanPham.topDanhMuc || d.sanPham.topDanhMuc.length === 0) && (
                <p className="text-xs text-stone-500 py-4 text-center">Chưa có dữ liệu</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 5: Tổng kho ── */}
      <div className="bg-white border border-stone-300 rounded-xl p-6 shadow-md">
        <h2 className="text-xs uppercase tracking-widest text-stone-500 font-medium mb-5">Tổng quan kho hàng</h2>
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            <Skel className="h-20" />
            <Skel className="h-20" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
            <div className="text-center">
              <p className="font-sans text-4xl font-bold text-espresso tabular-nums">
                {fmtNum((d?.sanPham.dangBan ?? 0) + (d?.sanPham.hetHang ?? 0))}
              </p>
              <p className="text-xs text-stone-600 font-medium mt-1 uppercase tracking-widest">Tổng sản phẩm</p>
            </div>
            <div className="sm:col-span-2 space-y-3">
              <div>
                <div className="flex justify-between text-xs text-stone-500 mb-1.5">
                  <span>Đang bán</span>
                  <span className="font-medium text-espresso">
                    {fmtNum(d?.sanPham.dangBan ?? 0)} sp ({pctDangBan}%)
                  </span>
                </div>
                <div className="h-2.5 bg-blush rounded-full overflow-hidden">
                  <div
                    className="h-full bg-espresso rounded-full transition-all duration-700"
                    style={{ width: `${pctDangBan}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-stone-500 mb-1.5">
                  <span>Hết hàng</span>
                  <span className="font-medium text-rose">
                    {fmtNum(d?.sanPham.hetHang ?? 0)} sp ({100 - pctDangBan}%)
                  </span>
                </div>
                <div className="h-2.5 bg-blush rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose rounded-full transition-all duration-700"
                    style={{ width: `${100 - pctDangBan}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
