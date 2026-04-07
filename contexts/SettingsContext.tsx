"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { CaiDat } from "@/types";

const SettingsContext = createContext<{
  settings: CaiDat;
  refresh: () => Promise<void>;
}>({
  settings: { logoURL: "", tenShop: "TRANH ANH STORE", sdt: "", diaChi: "", email: "" },
  refresh: async () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CaiDat>({
    logoURL: "", tenShop: "TRANH ANH STORE", sdt: "", diaChi: "", email: "",
  });

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/cai-dat", { cache: "no-store" });
      const data = await res.json();
      if (data.success) setSettings(data.data);
    } catch (e) {
      console.error("Failed to fetch settings:", e);
    }
  };

  useEffect(() => {
    fetchSettings();
    const handler = () => fetchSettings();
    window.addEventListener("settings-updated", handler);
    return () => window.removeEventListener("settings-updated", handler);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, refresh: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
