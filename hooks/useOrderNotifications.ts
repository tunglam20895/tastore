"use client";

import { useEffect, useState, useCallback, useRef } from "react";

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

type RealtimeConfig = {
  enabled: boolean;
  provider: "pusher" | null;
  key: string | null;
  cluster: string | null;
  notificationsChannel: string | null;
};

const LAST_READ_KEY = "admin-notif-last-read";

function sortNotifs(items: OrderNotif[]) {
  return [...items]
    .sort((a, b) => new Date(b.thoiGian).getTime() - new Date(a.thoiGian).getTime())
    .slice(0, 50);
}

async function getRealtimeConfig(): Promise<RealtimeConfig> {
  const res = await fetch("/api/realtime-config", { cache: "no-store" });
  const body = await res.json();
  return body?.data || { enabled: false, provider: null, key: null, cluster: null, notificationsChannel: null };
}

export function useOrderNotifications() {
  const [notifs, setNotifs] = useState<OrderNotif[]>([]);
  const [lastRead, setLastRead] = useState<string>(() => {
    if (typeof window === "undefined") return new Date(0).toISOString();
    return localStorage.getItem(LAST_READ_KEY) || new Date(0).toISOString();
  });
  const [realtimeStatus, setRealtimeStatus] = useState<"idle" | "connecting" | "connected" | "fallback">("idle");

  const isFirstFetchRef = useRef(true);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const pusherRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backupIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch("/api/thong-bao", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!data.success) return;

      const serverNotifs = sortNotifs(data.data as OrderNotif[]);
      setNotifs(serverNotifs);
      knownIdsRef.current = new Set(serverNotifs.map((n) => n.id));
      if (isFirstFetchRef.current) isFirstFetchRef.current = false;
    } catch {
      // ignore
    }
  }, []);

  const scheduleSync = useCallback(() => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      fetchNotifs();
    }, 250);
  }, [fetchNotifs]);

  useEffect(() => {
    let cancelled = false;

    const cleanup = () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
      if (backupIntervalRef.current) {
        clearInterval(backupIntervalRef.current);
        backupIntervalRef.current = null;
      }
      if (channelRef.current && pusherRef.current) {
        try {
          pusherRef.current.unsubscribe(channelRef.current.name);
        } catch {}
      }
      if (pusherRef.current) {
        try {
          pusherRef.current.disconnect();
        } catch {}
      }
      channelRef.current = null;
      pusherRef.current = null;
    };

    (async () => {
      await fetchNotifs();
      if (cancelled) return;

      try {
        const config = await getRealtimeConfig();
        if (cancelled) return;

        if (!config.enabled || !config.key || !config.cluster || !config.notificationsChannel) {
          setRealtimeStatus("fallback");
          backupIntervalRef.current = setInterval(fetchNotifs, 60_000);
          return;
        }

        setRealtimeStatus("connecting");
        const PusherModule = await import("pusher-js");
        const Pusher = PusherModule.default;
        const pusher = new Pusher(config.key, {
          cluster: config.cluster,
          forceTLS: true,
          channelAuthorization: {
            endpoint: "/api/pusher/auth",
            transport: "ajax",
          },
        });

        pusher.connection.bind("connected", () => setRealtimeStatus("connected"));
        pusher.connection.bind("error", () => setRealtimeStatus("fallback"));

        const channel = pusher.subscribe(config.notificationsChannel);
        channel.bind("pusher:subscription_error", () => setRealtimeStatus("fallback"));
        channel.bind("notifications:sync", () => scheduleSync());

        pusherRef.current = pusher;
        channelRef.current = channel;
        backupIntervalRef.current = setInterval(fetchNotifs, 300_000);
      } catch {
        setRealtimeStatus("fallback");
        backupIntervalRef.current = setInterval(fetchNotifs, 60_000);
      }
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [fetchNotifs, scheduleSync]);

  const unreadCount = notifs.filter((n) => !n.daDoc).length;

  const markAllRead = useCallback(async () => {
    const unread = notifs.filter((n) => !n.daDoc);
    if (unread.length === 0) return;

    try {
      await fetch("/api/thong-bao", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ markAll: true }),
      });
    } catch {
      // ignore
    }

    const now = new Date().toISOString();
    localStorage.setItem(LAST_READ_KEY, now);
    setLastRead(now);
    setNotifs((prev) => prev.map((n) => ({ ...n, daDoc: true })));
  }, [notifs]);

  return { notifs, unreadCount, markAllRead, lastRead, refresh: fetchNotifs, realtimeStatus };
}
