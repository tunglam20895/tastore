import { Metadata } from "next";
import AdminNav from "@/components/admin/AdminNav";
import { TrangThaiDHProvider } from "@/contexts/TrangThaiDHContext";

export const metadata: Metadata = {
  title: "Admin - TRANG ANH STORE",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TrangThaiDHProvider>
      <AdminNav>{children}</AdminNav>
    </TrangThaiDHProvider>
  );
}
