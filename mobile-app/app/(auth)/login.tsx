"use client";

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { loginAdmin, loginStaff } from "@/src/api/auth";
import { useAuthStore } from "@/src/store/authStore";
import { colors } from "@/src/theme";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";

export default function LoginScreen() {
  const [mode, setMode] = useState<"admin" | "staff">("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { loginAsAdmin, loginAsStaff } = useAuthStore();

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    // Minimum loading to show animation
    await new Promise<void>((resolve) => setTimeout(resolve, 500));

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
          await loginAsStaff(
            data.staffToken || "",
            data.quyen || [],
            data.ten || "",
            data.id || ""
          );
          router.replace("/(admin)");
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <LoadingSpinner size="lg" />
          <Text style={styles.shopName}>TRANG ANH STORE</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, mode === "admin" && styles.tabActive]}
            onPress={() => {
              setMode("admin");
              setError("");
            }}
          >
            <Text
              style={[styles.tabText, mode === "admin" && styles.tabTextActive]}
            >
              Admin
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === "staff" && styles.tabActive]}
            onPress={() => {
              setMode("staff");
              setError("");
            }}
          >
            <Text
              style={[styles.tabText, mode === "staff" && styles.tabTextActive]}
            >
              Nhân viên
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {mode === "staff" && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên đăng nhập</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Nhập tên đăng nhập"
                placeholderTextColor={colors.stone[400]}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {mode === "admin" ? "Mật khẩu admin" : "Mật khẩu"}
            </Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Nhập mật khẩu"
              placeholderTextColor={colors.stone[400]}
              secureTextEntry
              autoCapitalize="none"
              onSubmitEditing={handleLogin}
              returnKeyType="go"
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[
              styles.button,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Text style={styles.buttonText}>ĐĂNG NHẬP</Text>
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
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  shopName: {
    fontSize: 14,
    fontWeight: "300",
    letterSpacing: 4,
    color: colors.espresso,
    marginTop: 8,
    fontFamily: "CormorantGaramond",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.stone[300],
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.espresso,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.stone[500],
  },
  tabTextActive: {
    color: colors.cream,
  },
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
    color: colors.stone[600],
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.stone[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.espresso,
  },
  errorText: {
    fontSize: 14,
    color: "#DC2626",
    textAlign: "center",
    marginTop: 8,
  },
  button: {
    backgroundColor: colors.espresso,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.5,
    color: colors.cream,
    textTransform: "uppercase",
  },
});
