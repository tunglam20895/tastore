import { Stack } from "expo-router";
import { useAuthStore } from "@/src/store/authStore";
import { useNotifications, NotificationContext } from "@/src/hooks/useNotifications";
import { colors } from "@/src/theme";
import { View, Platform, StyleSheet, SafeAreaView } from "react-native";
import { BottomNavBar } from "@/src/components/ui/BottomNavBar";

const isWeb = Platform.OS === "web";

export default function AdminLayout() {
  const notifHook = useNotifications();

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
