import type { Metadata } from "next";
import "./globals.css";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { CartProvider } from "@/contexts/CartContext";
import { ToastProvider } from "@/contexts/ToastContext";
import TrackingPixel from "@/components/TrackingPixel";
import FlyToCartAnimation from "@/components/FlyToCartAnimation";

export const metadata: Metadata = {
  title: "TRANG ANH STORE - Thời Trang Nữ Cao Cấp",
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
          <CartProvider>
            <ToastProvider>
              <TrackingPixel />
              <FlyToCartAnimation />
              {children}
            </ToastProvider>
          </CartProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
