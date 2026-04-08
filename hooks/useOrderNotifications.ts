"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabaseClient } from "@/lib/supabase-client";

export interface OrderNotif {
  id: string;
  tenKH: string;
  tongTien: number;
  thoiGian: string;
}

const LAST_READ_KEY = "admin-notif-last-read";

export function useOrderNotifications() {
  const [orders, setOrders] = useState<OrderNotif[]>([]);
  const [lastRead, setLastRead] = useState<string>(() => {
    if (typeof window === "undefined") return new Date(0).toISOString();
    return localStorage.getItem(LAST_READ_KEY) || new Date(0).toISOString();
  });

  const adminPassword = useRef<string>("");
  useEffect(() => {
    adminPassword.current = localStorage.getItem("admin-password") || "";
  }, []);

  const fetchNewOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams({ trang_thai: "Mới", page: "1", limit: "20" });
      const res = await fetch(`/api/don-hang?${params}`, {
        headers: { "x-admin-password": adminPassword.current },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.data.map((o: any) => ({
            id: o.id,
            tenKH: o.tenKH,
            tongTien: o.tongTien,
            thoiGian: o.thoiGian,
          }))
        );
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    adminPassword.current = localStorage.getItem("admin-password") || "";
    fetchNewOrders();

    // Realtime: nhận đơn mới tức thì
    const channel = supabaseClient
      .channel("don-hang-notif")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "don_hang" },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          setOrders((prev) =>
            [
              {
                id: row.id as string,
                tenKH: row.ten_kh as string,
                tongTien: Number(row.tong_tien),
                thoiGian: row.thoi_gian as string,
              },
              ...prev,
            ].slice(0, 30)
          );
        }
      )
      .subscribe();

    // Polling 60s làm backup
    const interval = setInterval(fetchNewOrders, 60_000);

    return () => {
      supabaseClient.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchNewOrders]);

  const unreadCount = orders.filter((o) => o.thoiGian > lastRead).length;

  const markAllRead = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(LAST_READ_KEY, now);
    setLastRead(now);
  }, []);

  return { orders, unreadCount, markAllRead, lastRead };
}
