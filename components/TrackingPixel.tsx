"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function TrackingPixel() {
  const pathname = usePathname();

  useEffect(() => {
    // Không track trang admin
    if (pathname?.startsWith("/admin")) return;

    fetch("/api/tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trang: pathname || "/",
        user_agent: navigator.userAgent,
        ref: document.referrer || null,
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
