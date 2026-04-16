import { Tabs, useRouter, usePathname } from "expo-router";
import { useAuthStore } from "@/src/store/authStore";
import { useNotifications } from "@/src/hooks/useNotifications";
import { colors } from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";
import { View, Platform, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useCallback } from "react";
import BottomDrawer from "@/src/components/admin/BottomDrawer";
import AdminHeader from "@/src/components/admin/AdminHeader";

const isWeb = Platform.OS === "web";
const NAV_BASE = 56;

// ====================================================
// Bottom nav bar - Fixed for web + mobile navigation
// ====================================================
function BottomNav({ state, descriptors, navigation }: any) {
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const { role, staffQuyen } = useAuthStore();
  const isAdmin = role === "admin";
  const insets = useSafeAreaInsets();
  const [showDrawer, setShowDrawer] = useState(false);

  const tabs = [
    { name: "dashboard", label: "Dashboard", icon: "home-outline", activeIcon: "home", quyen: "dashboard" },
    { name: "don-hang", label: "Đơn hàng", icon: "document-text-outline", activeIcon: "document-text", quyen: "don-hang", badge: unreadCount },
    { name: "san-pham", label: "Sản phẩm", icon: "shirt-outline", activeIcon: "shirt", quyen: "san-pham" },
    { name: "khach-hang", label: "Khách hàng", icon: "people-outline", activeIcon: "people", quyen: "khach-hang" },
    { name: "cai-dat", label: "Cài đặt", icon: "person-outline", activeIcon: "person", quyen: "admin-only" },
    { name: "more", label: "Menu", icon: "menu-outline", activeIcon: "menu", quyen: null },
  ].filter((t) => {
    if (t.quyen === 'admin-only') return isAdmin;
    return !t.quyen || isAdmin || staffQuyen.includes(t.quyen);
  });

  // Check if a tab is currently active
  const isTabActive = useCallback((tabName: string): boolean => {
    if (tabName === "dashboard") {
      return pathname === "/(admin)/dashboard" || pathname === "/(admin)/" || pathname === "/(admin)";
    }
    return pathname.includes(`/${tabName}`);
  }, [pathname]);

  // Handle tab navigation
  const handleTabPress = useCallback((tabName: string) => {
    if (tabName === "more") {
      setShowDrawer(true);
      return;
    }
    // On web, use router.replace for clean navigation
    if (isWeb) {
      router.replace(`/(admin)/${tabName}` as any);
      return;
    }
    // On mobile, use the native tab navigation
    const route = state?.routes?.find((r: any) => r.name === tabName);
    if (!route) return;
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  }, [isWeb, router, state, navigation]);

  const tabBarPaddingBottom = Math.max(insets.bottom, 6);

  return (
    <>
      <View style={[s.tabBar, { paddingBottom: tabBarPaddingBottom }]}>
        {tabs.map((tab) => {
          const focused = isTabActive(tab.name);

          return (
            <TouchableOpacity
              key={tab.name}
              style={s.tabItem}
              onPress={() => handleTabPress(tab.name)}
              activeOpacity={0.7}
            >
              <View style={s.iconWrap}>
                <Ionicons name={(focused ? tab.activeIcon : tab.icon) as any} size={24} color={focused ? colors.espresso : colors.stone[400]} />
                {tab.badge ? (
                  <View style={s.dot}><Ionicons name="ellipse" size={7} color="#DC2626" /></View>
                ) : null}
              </View>
              <Text style={[s.tabLabel, focused && s.tabLabelActive]}>{tab.label}</Text>
              {focused && <View style={s.indicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
      <BottomDrawer visible={showDrawer} onClose={() => setShowDrawer(false)} />
    </>
  );
}

// ====================================================
// Layout
// ====================================================
export default function AdminTabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, paddingTop: isWeb ? 0 : insets.top }}>
      <AdminHeader />
      <View style={{ flex: 1 }}>
        <Tabs
          tabBar={(props) => <BottomNav {...props} />}
          screenOptions={{
            headerShown: false,
          }}
        >
          <Tabs.Screen name="dashboard" />
          <Tabs.Screen name="don-hang" />
          <Tabs.Screen name="san-pham" />
          <Tabs.Screen name="khach-hang" />
          <Tabs.Screen name="cai-dat" />
          <Tabs.Screen name="ma-giam-gia" options={{ href: null }} />
          <Tabs.Screen name="nhan-vien" options={{ href: null }} />
          <Tabs.Screen name="ai-chat" options={{ href: null }} />
          <Tabs.Screen name="more" options={{ href: null }} />
          {/* Stack screens - accessible via router.push */}
          <Tabs.Screen name="don-hang/[id]" options={{ href: null }} />
          <Tabs.Screen name="don-hang/add" options={{ href: null }} />
          <Tabs.Screen name="san-pham/[id]" options={{ href: null }} />
          <Tabs.Screen name="san-pham/add" options={{ href: null }} />
        </Tabs>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderTopWidth: 0.5,
    borderTopColor: `${colors.stone[200]}40`,
    paddingTop: 6,
    height: NAV_BASE + 6,
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2 },
  iconWrap: { position: "relative", alignItems: "center", justifyContent: "center" },
  dot: { position: "absolute", top: -3, right: -5 },
  tabLabel: { fontSize: 10, fontWeight: "500", color: colors.stone[400] },
  tabLabelActive: { color: colors.espresso, fontWeight: "700" },
  indicator: { width: 18, height: 3, borderRadius: 2, backgroundColor: colors.blush, marginTop: 2 },
});
