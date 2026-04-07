import { Metadata } from "next";
import AdminNav from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: "Admin - TRANH ANH STORE",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminNav>{children}</AdminNav>;
}
