import { Metadata } from "next";
import AdminNav from "@/components/admin/AdminNav";
import AdminChatForLayout from "@/components/admin/AdminChatForLayout";
import { AdminChatProvider } from "@/contexts/AdminChatContext";
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
      <AdminChatProvider>
        <AdminNav>{children}</AdminNav>
        <AdminChatForLayout />
      </AdminChatProvider>
    </TrangThaiDHProvider>
  );
}
