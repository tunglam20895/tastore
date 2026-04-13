import { Tabs } from "expo-router";
import { useAuthStore } from "@/src/store/authStore";
import { colors } from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";

export default function AdminTabsLayout() {
  const { role, staffQuyen } = useAuthStore();
  const isAdmin = role === "admin";
  const hasPermission = (quyen: string) =>
    isAdmin || staffQuyen.includes(quyen);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream },
        headerTintColor: colors.espresso,
        headerTitleStyle: {
          fontWeight: "300",
          letterSpacing: 2,
        },
        tabBarActiveTintColor: colors.espresso,
        tabBarInactiveTintColor: colors.stone[400],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.stone[200],
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 0.5,
        },
      }}
    >
      {/* Dashboard */}
      {hasPermission("dashboard") && (
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart" size={size} color={color} />
            ),
          }}
        />
      )}

      {/* Sản phẩm */}
      {hasPermission("san-pham") && (
        <Tabs.Screen
          name="san-pham"
          options={{
            title: "Sản phẩm",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="shirt" size={size} color={color} />
            ),
          }}
        />
      )}

      {/* Đơn hàng */}
      {hasPermission("don-hang") && (
        <Tabs.Screen
          name="don-hang"
          options={{
            title: "Đơn hàng",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="receipt" size={size} color={color} />
            ),
          }}
        />
      )}

      {/* More - stack for other pages */}
      <Tabs.Screen
        name="more"
        options={{
          title: "Thêm",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />

      {/* Hide these from tabs, accessible via navigation */}
      <Tabs.Screen name="khach-hang" options={{ href: null }} />
      <Tabs.Screen name="ma-giam-gia" options={{ href: null }} />
      <Tabs.Screen name="nhan-vien" options={{ href: null }} />
      <Tabs.Screen name="cai-dat" options={{ href: null }} />
    </Tabs>
  );
}
