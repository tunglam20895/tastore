"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabaseClient } from "@/lib/supabase-client";

export type NotifType = "don_moi" | "chuyen_trang_thai";

export interface OrderNotif {
  id: string;
  loai: NotifType;
  donHangId: string;
  tenKH: string;
  tenSP: string;
  tongTien?: number;
  nguoiXuLy?: string;
  trangThaiCu?: string;
  trangThaiMoi: string;
  daDoc: boolean;
  thoiGian: string;
}

const LAST_READ_KEY = "admin-notif-last-read";

function mapRow(row: Record<string, unknown>): OrderNotif {
  return {
    id: row.id as string,
    loai: (row.loai as NotifType) || "don_moi",
    donHangId: (row.don_hang_id as string) || "",
    tenKH: (row.ten_kh as string) || "",
    tenSP: (row.ten_sp as string) || "",
    tongTien: Number(row.tong_tien ?? 0),
    nguoiXuLy: row.nguoi_xu_ly as string | undefined,
    trangThaiCu: row.trang_thai_cu as string | undefined,
    trangThaiMoi: (row.trang_thai_moi as string) || "",
    daDoc: (row.da_doc as boolean) || false,
    thoiGian: row.thoi_gian as string,
  };
}

/**
 * Hook quản lý thông báo — lắng nghe don_hang REALTIME TRỰC TIẾP (không qua trigger thong_bao)
 * 
 * Tại sao lắng nghe don_hang thay vì thong_bao?
 * - don_hang INSERT/UPDATE → broadcast realtime NGAY LẬP TỨC
 * - thong_bao → phải chờ trigger INSERT xong → thêm 1 bước trễ
 * 
 * Flow:
 * 1. Fetch danh sách từ /api/thong-bao (lịch sử, trạng thái đã đọc)
 * 2. Lắng nghe don_hang INSERT → thêm thông báo "đơn mới" ngay lập tức (local)
 * 3. Lắng nghe don_hang UPDATE → nếu trang_thai thay đổi → thêm "chuyển trạng thái" ngay (local)
 * 4. Polling 60s đồng bộ lại với server (backup + đánh dấu đã đọc)
 */
export function useOrderNotifications() {
  const [notifs, setNotifs] = useState<OrderNotif[]>([]);
  const [lastRead, setLastRead] = useState<string>(() => {
    if (typeof window === "undefined") return new Date(0).toISOString();
    return localStorage.getItem(LAST_READ_KEY) || new Date(0).toISOString();
  });

  const adminPassword = useRef<string>("");
  useEffect(() => {
    adminPassword.current = localStorage.getItem("admin-password") || "";
  }, []);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch("/api/thong-bao", {
        headers: { "x-admin-password": adminPassword.current },
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success) {
        // Merge: cập nhật da_doc từ server nhưng GIỮ LẠI các notif realtime chưa có trong server
        const serverNotifs = data.data as OrderNotif[];
        setNotifs((prev) => {
          // Tạo set các donHangId đã có trong server
          const serverDonHangIds = new Set(serverNotifs.map((n) => n.donHangId + "_" + n.trangThaiMoi));

          // Giữ lại các notif realtime chưa có trong server (đơn mới/chuyển trạng thái vừa xảy ra)
          const realtimeOnly = prev.filter((n) => !serverDonHangIds.has(n.donHangId + "_" + n.trangThaiMoi));

          return [...serverNotifs, ...realtimeOnly].slice(0, 50);
        });
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    adminPassword.current = localStorage.getItem("admin-password") || "";
    fetchNotifs();

    // === LẮNG NGHE DON_HANG TRỰC TIẾP — NHẬN NGAY LẬP TỨC ===
    const channel = supabaseClient
      .channel("don-hang-notif-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "don_hang" },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const items = (row.san_pham as Array<{ ten: string }>) || [];
          const newNotif: OrderNotif = {
            id: crypto.randomUUID(),
            loai: "don_moi",
            donHangId: row.id as string,
            tenKH: row.ten_kh as string,
            tenSP: items[0]?.ten || "",
            tongTien: Number(row.tong_tien ?? 0),
            trangThaiMoi: row.trang_thai as string,
            daDoc: false,
            thoiGian: row.thoi_gian as string,
          };
          setNotifs((prev) => [newNotif, ...prev].slice(0, 50));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "don_hang" },
        (payload) => {
          const oldStatus = payload.old?.trang_thai as string | undefined;
          const newStatus = payload.new?.trang_thai as string | undefined;

          // Chỉ tạo thông báo khi trạng thái thay đổi
          if (oldStatus && newStatus && oldStatus !== newStatus) {
            const row = payload.new as Record<string, unknown>;
            const items = (row.san_pham as Array<{ ten: string }>) || [];
            const newNotif: OrderNotif = {
              id: crypto.randomUUID(),
              loai: "chuyen_trang_thai",
              donHangId: row.id as string,
              tenKH: row.ten_kh as string,
              tenSP: items[0]?.ten || "",
              nguoiXuLy: row.nguoi_xu_ly as string,
              trangThaiCu: oldStatus,
              trangThaiMoi: newStatus,
              daDoc: false,
              thoiGian: new Date().toISOString(),
            };
            setNotifs((prev) => [newNotif, ...prev].slice(0, 50));
          }
        }
      )
      .subscribe();

    // Polling 60s đồng bộ lại với server (backup + cập nhật da_doc)
    const interval = setInterval(fetchNotifs, 60_000);

    return () => {
      supabaseClient.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchNotifs]);

  const unreadCount = notifs.filter((n) => !n.daDoc).length;

  const markAllRead = useCallback(async () => {
    const unread = notifs.filter((n) => !n.daDoc);
    if (unread.length === 0) return;

    // Lọc ra các notif có id từ server (uuid hợp lệ)
    const serverIds = unread
      .filter((n) => /^[0-9a-f-]{36}$/i.test(n.id))
      .map((n) => n.id);

    // Đánh dấu đã đọc trên server (chỉ những id từ thong_bao)
    if (serverIds.length > 0) {
      try {
        await fetch("/api/thong-bao", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-admin-password": adminPassword.current,
          },
          body: JSON.stringify({ ids: serverIds }),
        });
      } catch {
        // ignore
      }
    }

    // Cập nhật UI ngay lập tức
    const now = new Date().toISOString();
    localStorage.setItem(LAST_READ_KEY, now);
    setLastRead(now);
    setNotifs((prev) => prev.map((n) => ({ ...n, daDoc: true })));
  }, [notifs]);

  return { notifs, unreadCount, markAllRead, lastRead, refresh: fetchNotifs };
}
