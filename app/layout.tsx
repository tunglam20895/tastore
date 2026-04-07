import type { Metadata } from "next";
import "./globals.css";
import { SettingsProvider } from "@/contexts/SettingsContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TrackingPixel from "@/components/TrackingPixel";

export const metadata: Metadata = {
  title: "TRANH ANH STORE - Thời Trang Nữ Cao Cấp",
  description: "Thời trang nữ cao cấp — Nhẹ nhàng, thanh lịch, tự do.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased min-h-screen flex flex-col bg-cream">
        <SettingsProvider>
          <TrackingPixel />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </SettingsProvider>
      </body>
    </html>
  );
}
