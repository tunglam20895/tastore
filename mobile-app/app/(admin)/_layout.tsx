import { Stack, usePathname, useRouter } from "expo-router";
import { useAuthStore } from "@/src/store/authStore";
import { useNotifications, NotificationContext } from "@/src/hooks/useNotifications";
import { colors } from "@/src/theme";
import { View, Platform, StyleSheet, SafeAreaView, BackHandler } from "react-native";
import { BottomNavBar } from "@/src/components/ui/BottomNavBar";
import { useEffect } from "react";

const isWeb = Platform.OS === "web";

// Các màn hình "root" của admin — không cho back ra ngoài
const ROOT_ROUTES = [
  "/(admin)/dashboard",
  "/(admin)/don-hang",
  "/(admin)/san-pham",
  "/(admin)/khach-hang",
  "/(admin)/more",
];

export default function AdminLayout() {
  const notifHook = useNotifications();
  const pathname = usePathname();
  const router = useRouter();

  // Chặn nút back vật lý Android khi đang ở root admin
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const onBack = () => {
      const isRoot = ROOT_ROUTES.some((r) => pathname.startsWith(r.replace("/(admin)", "")));
      if (isRoot) {
        // Đang ở root → không cho thoát ra login
        return true; // chặn
      }
      // Các màn detail (san-pham/[id], don-hang/[id]...) → cho back về list
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      // Fallback: về dashboard thay vì auth
      router.replace("/(admin)/dashboard" as any);
      return true;
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
    return () => sub.remove();
  }, [pathname, router]);

  return (
    <NotificationContext.Provider value={notifHook}>
      <View style={styles.container}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.brandBg },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="dashboard/index" />
          <Stack.Screen name="don-hang" />
          <Stack.Screen name="san-pham/index" />
          <Stack.Screen name="san-pham/add" />
          <Stack.Screen name="san-pham/[id]" />
          <Stack.Screen name="khach-hang/index" />
          <Stack.Screen name="ma-giam-gia/index" />
          <Stack.Screen name="nhan-vien/index" />
          <Stack.Screen name="cai-dat/index" />
          <Stack.Screen name="more/index" />
          <Stack.Screen name="ai-chat" />
        </Stack>
        <BottomNavBar />
      </View>
    </NotificationContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brandBg,
  },
});
