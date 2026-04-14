import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { TrangThaiDHProvider } from "@/contexts/TrangThaiDHContext";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <TrangThaiDHProvider>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </TrangThaiDHProvider>
  );
}
