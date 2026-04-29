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
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { loginAdmin, loginStaff } from "@/src/api/auth";
import { useAuthStore } from "@/src/store/authStore";
import { colors, borderRadius, shadows } from "@/src/theme";
import { legacyColors } from '@/src/theme/legacy-colors';
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
  const normalizedQuyen = quyen.map(q => q.toLowerCase());
  for (const screen of SCREEN_PRIORITY) {
    if (normalizedQuyen.includes(screen.quyen)) return screen.route;
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
        {/* Logo - Image-based */}
        <View style={[styles.logoContainer, keyboardVisible && styles.logoContainerKeyboard]}>
          <Image 
            source={require('@/assets/logo-app.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.shopName}>TRANG ANH STORE</Text>
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
              color={mode === "admin" ? legacyColors.cream : legacyColors.stone[500]}
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
              color={mode === "staff" ? legacyColors.cream : legacyColors.stone[500]}
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
                <Ionicons name="person-outline" size={18} color={legacyColors.stone[400]} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Nhập tên đăng nhập"
                  placeholderTextColor={legacyColors.stone[300]}
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
              <Ionicons name="lock-closed-outline" size={18} color={legacyColors.stone[400]} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Nhập mật khẩu"
                placeholderTextColor={legacyColors.stone[300]}
                secureTextEntry
                autoCapitalize="none"
                onSubmitEditing={handleLogin}
                returnKeyType="go"
              />
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={legacyColors.danger} />
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
                <Ionicons name="log-in-outline" size={20} color={legacyColors.cream} />
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
    backgroundColor: legacyColors.cream,
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
  logoImage: {
    width: 180,
    height: 180,
    marginBottom: 12,
  },
  shopName: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 4,
    color: legacyColors.espresso,
    marginTop: 8,
    textTransform: "uppercase",
  },
  shopSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 2,
    color: legacyColors.stone[400],
    textTransform: "uppercase",
    marginTop: 4,
  },

  // Mode toggle
  modeToggle: {
    flexDirection: "row",
    backgroundColor: legacyColors.white,
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: legacyColors.stone[200],
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
    backgroundColor: legacyColors.espresso,
  },
  modeText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: legacyColors.stone[500],
  },
  modeTextActive: {
    color: legacyColors.cream,
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
    color: legacyColors.stone[500],
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: legacyColors.white,
    borderWidth: 1,
    borderColor: legacyColors.stone[200],
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
    color: legacyColors.espresso,
    height: 48,
  },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${legacyColors.danger}10`,
    borderRadius: borderRadius.sm,
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    color: legacyColors.danger,
    flex: 1,
    fontWeight: '500',
  },

  // Button
  button: {
    backgroundColor: legacyColors.espresso,
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
    color: legacyColors.cream,
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
    backgroundColor: legacyColors.cream,
  },
});
