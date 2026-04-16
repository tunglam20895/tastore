import { Redirect } from "expo-router";
import { useAuthStore } from "@/src/store/authStore";

// Thứ tự ưu tiên màn hình theo quyền
const SCREEN_PRIORITY = [
  { quyen: "dashboard",   route: "/(admin)/dashboard"   },
  { quyen: "don-hang",    route: "/(admin)/don-hang"    },
  { quyen: "san-pham",    route: "/(admin)/san-pham"    },
  { quyen: "khach-hang",  route: "/(admin)/khach-hang"  },
  { quyen: "ma-giam-gia", route: "/(admin)/ma-giam-gia" },
] as const;

export default function AdminIndex() {
  const { role, staffQuyen } = useAuthStore();

  // Admin luôn vào dashboard
  if (role === "admin") {
    return <Redirect href="/(admin)/dashboard" />;
  }

  // Staff → tìm màn hình đầu tiên có quyền
  for (const screen of SCREEN_PRIORITY) {
    if (staffQuyen.includes(screen.quyen)) {
      return <Redirect href={screen.route as any} />;
    }
  }

  // Không có quyền nào → vào more
  return <Redirect href="/(admin)/more" />;
}
