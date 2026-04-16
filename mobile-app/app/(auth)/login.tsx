import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { loginAdmin, loginStaff } from "@/src/api/auth";
import { useAuthStore } from "@/src/store/authStore";
import { colors, borderRadius, shadows } from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";

// Thứ tự ưu tiên màn hình theo quyền
const SCREEN_PRIORITY = [
  { quyen: "dashboard",   route: "/(admin)/dashboard"   },
  { quyen: "don-hang",    route: "/(admin)/don-hang"    },
  { quyen: "san-pham",    route: "/(admin)/san-pham"    },
  { quyen: "khach-hang",  route: "/(admin)/khach-hang"  },
  { quyen: "ma-giam-gia", route: "/(admin)/ma-giam-gia" },
];

function getFirstAllowedScreen(quyen: string[]): string {
  for (const screen of SCREEN_PRIORITY) {
    if (quyen.includes(screen.quyen)) return screen.route;
  }
  // Không có quyền nào khớp → vào more (menu)
  return "/(admin)/more";
}

export default function LoginScreen() {
  const [mode, setMode] = useState<"admin" | "staff">("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const router = useRouter();
  const { loginAsAdmin, loginAsStaff } = useAuthStore();

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      if (mode === "admin") {
        const data = await loginAdmin(password);
        if (data.success) {
          await loginAsAdmin(password);
          router.replace("/(admin)");
        } else {
          setError(data.error || "Sai mật khẩu");
        }
      } else {
        const data = await loginStaff(username.trim(), password);
        if (data.success) {
          const quyen: string[] = data.quyen || [];
          await loginAsStaff(
            data.staffToken || "",
            quyen,
            data.ten || "",
            data.id || ""
          );
          // Điều hướng tới màn hình đầu tiên nhân viên có quyền truy cập
          const firstScreen = getFirstAllowedScreen(quyen);
          router.replace(firstScreen as any);
        } else {
          setError(data.error || "Sai tên đăng nhập hoặc mật khẩu");
        }
      }
    } catch {
      setError("Không thể kết nối đến máy chủ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Logo - Clean text-based */}
        <View style={[styles.logoContainer, keyboardVisible && styles.logoContainerKeyboard]}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>TA</Text>
          </View>
          <Text style={styles.shopName}>TRANG ANH STORE</Text>
          <Text style={styles.shopSubtitle}>Admin Panel</Text>
        </View>

        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeTab, mode === "admin" && styles.modeTabActive]}
            onPress={() => { setMode("admin"); setError(""); }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={mode === "admin" ? "shield-checkmark" : "shield-checkmark-outline"}
              size={18}
              color={mode === "admin" ? colors.cream : colors.stone[500]}
            />
            <Text style={[styles.modeText, mode === "admin" && styles.modeTextActive]}>
              Admin
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, mode === "staff" && styles.modeTabActive]}
            onPress={() => { setMode("staff"); setError(""); }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={mode === "staff" ? "person" : "person-outline"}
              size={18}
              color={mode === "staff" ? colors.cream : colors.stone[500]}
            />
            <Text style={[styles.modeText, mode === "staff" && styles.modeTextActive]}>
              Nhân viên
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {mode === "staff" && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên đăng nhập</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={18} color={colors.stone[400]} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Nhập tên đăng nhập"
                  placeholderTextColor={colors.stone[300]}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {mode === "admin" ? "Mật khẩu admin" : "Mật khẩu"}
            </Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.stone[400]} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Nhập mật khẩu"
                placeholderTextColor={colors.stone[300]}
                secureTextEntry
                autoCapitalize="none"
                onSubmitEditing={handleLogin}
                returnKeyType="go"
              />
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <View style={styles.loadingDot} />
                <View style={styles.loadingDot} />
                <View style={styles.loadingDot} />
              </View>
            ) : (
              <>
                <Ionicons name="log-in-outline" size={20} color={colors.cream} />
                <Text style={styles.buttonText}>Đăng nhập</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },

  // Logo
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoContainerKeyboard: {
    marginBottom: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.espresso,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.card,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "900",
    color: colors.cream,
    letterSpacing: 2,
  },
  shopName: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 3,
    color: colors.espresso,
    marginTop: 16,
    textTransform: "uppercase",
  },
  shopSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 2,
    color: colors.stone[400],
    textTransform: "uppercase",
    marginTop: 4,
  },

  // Mode toggle
  modeToggle: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.stone[200],
    ...shadows.card,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: borderRadius.sm,
  },
  modeTabActive: {
    backgroundColor: colors.espresso,
  },
  modeText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.stone[500],
  },
  modeTextActive: {
    color: colors.cream,
  },

  // Form
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.stone[500],
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.stone[200],
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.espresso,
    height: 48,
  },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${"#DC2626"}10`,
    borderRadius: borderRadius.sm,
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    color: "#DC2626",
    flex: 1,
    fontWeight: '500',
  },

  // Button
  button: {
    backgroundColor: colors.espresso,
    paddingVertical: 14,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    color: colors.cream,
    textTransform: "uppercase",
  },
  loadingRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.cream,
  },
});
