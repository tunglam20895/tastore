import React, { useState, useCallback } from "react";
import { useRequireQuyen } from "@/src/hooks/useRequireQuyen";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, RefreshControl, Modal, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getStaff, createStaff, updateStaff, deleteStaff } from "@/src/api/nhan-vien";
import { colors } from "@/src/theme";
import { legacyColors } from "@/src/theme/legacy-colors";
import { ALL_QUYEN } from "@/src/types";
import { formatMoney } from "@/src/utils/format";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import EmptyState from "@/src/components/ui/EmptyState";
import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";
import ConfirmDialog from "@/src/components/ui/ConfirmDialog";
import Badge from "@/src/components/ui/Badge";
import { Ionicons } from "@expo/vector-icons";
import { showSuccess, showError, showInfo } from "@/src/utils/toast";

export default function StaffScreen() {
  useRequireQuyen(); // admin only
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [ten, setTen] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [quyen, setQuyen] = useState<string[]>([]);
  const [luong, setLuong] = useState("");
  const [conHoatDong, setConHoatDong] = useState(true);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["staff"],
    queryFn: () => getStaff(),
  });
  const staffList = (data?.data || data || []) as any[];

  const openAdd = () => {
    setEditingStaff(null);
    setTen(""); setUsername(""); setPassword("");
    setQuyen([]); setLuong(""); setConHoatDong(true);
    setShowAdd(true);
  };

  const openEdit = (nv: any) => {
    setEditingStaff(nv);
    setTen(nv.ten); setUsername(nv.username); setPassword("");
    setQuyen(nv.quyen || []); setLuong(nv.luong?.toString() || "");
    setConHoatDong(nv.conHoatDong);
    setShowAdd(true);
  };

  const handleSave = async () => {
    if (!ten.trim()) { showError("Vui lòng nhập tên"); return; }
    if (!editingStaff) {
      if (!username.trim()) { showError("Vui lòng nhập username"); return; }
      if (!password.trim()) { showError("Vui lòng nhập mật khẩu"); return; }
      if (password.length < 6) { showError("Mật khẩu tối thiểu 6 ký tự"); return; }
    } else if (password && password.length < 6) {
      showError("Mật khẩu tối thiểu 6 ký tự"); return;
    }

    try {
      // Backend nhận camelCase: conHoatDong (KHÔNG phải con_hoat_dong)
      const d: Record<string, unknown> = {
        ten: ten.trim(),
        quyen,
        luong: parseFloat(luong) || 0,
        conHoatDong,
      };
      if (!editingStaff) {
        d.username = username.trim();
        d.password = password;
      } else if (password) {
        d.password = password;
      }

      if (editingStaff) {
        await updateStaff(editingStaff.id, d);
      } else {
        await createStaff(d);
      }
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setShowAdd(false);
      showSuccess(editingStaff ? "Đã cập nhật" : "Đã thêm nhân viên");
    } catch (err: any) {
      const apiMsg = err?.response?.data?.error;
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        showError("Bạn không có quyền quản lý nhân viên");
      } else if (status === 409) {
        showError(apiMsg || "Username đã tồn tại");
      } else {
        showError(apiMsg || "Không thể lưu");
      }
      console.error('[nhan-vien] save error:', err?.response?.data || err);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteStaff(deleteId);
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      showSuccess("Đã xóa nhân viên");
    } catch {
      showError("Không thể xóa");
    }
    setDeleteId(null);
  };

  const toggleQuyen = (key: string) => {
    setQuyen(prev => prev.includes(key) ? prev.filter(q => q !== key) : [...prev, key]);
  };

  const renderItem = useCallback(({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => openEdit(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.ten[0] || "?").toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.name}>{item.ten}</Text>
          <View style={styles.usernameRow}>
            <Ionicons name="at-circle-outline" size={13} color={legacyColors.blush} />
            <Text style={styles.username}>{item.username}</Text>
          </View>
        </View>
        <Switch value={item.conHoatDong} onValueChange={() => {
          updateStaff(item.id, { conHoatDong: !item.conHoatDong })
            .then(() => queryClient.invalidateQueries({ queryKey: ["staff"] }))
            .catch((err) => {
              showError(err?.response?.data?.error || "Không thể cập nhật");
            });
        }} />
      </View>
      <View style={styles.quyenRow}>
        {(item.quyen || []).map((q: string) => {
          const found = ALL_QUYEN.find(a => a.key === q);
          return <Badge key={q} text={found?.label || q} variant="info" />;
        })}
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.salary}>Lương: {formatMoney(item.luong || 0)}</Text>
        <TouchableOpacity onPress={() => setDeleteId(item.id)}>
          <Ionicons name="trash" size={16} color={legacyColors.rose} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  ), [openEdit, queryClient, setDeleteId]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nhân viên</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={20} color={legacyColors.cream} />
        </TouchableOpacity>
      </View>

      {isLoading && !data ? (
        <LoadingSpinner size="full" label="Đang tải..." />
      ) : !staffList.length ? (
        <EmptyState title="Chưa có nhân viên" actionLabel="Thêm mới" onAction={openAdd} />
      ) : (
        <FlatList
          data={staffList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => refetch()} />}
          windowSize={10}
          maxToRenderPerBatch={10}
          initialNumToRender={10}
          removeClippedSubviews={true}
        />
      )}

      {/* Add/Edit modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{editingStaff ? "Sửa nhân viên" : "Thêm nhân viên"}</Text>
                <Input label="Tên" value={ten} onChangeText={setTen} />
                {editingStaff ? (
                  <View style={styles.readonlyField}>
                    <Text style={styles.readonlyLabel}>Tên đăng nhập</Text>
                    <View style={styles.readonlyValueWrap}>
                      <Ionicons name="at-circle-outline" size={16} color={legacyColors.blush} />
                      <Text style={styles.readonlyValue}>{username}</Text>
                    </View>
                  </View>
                ) : (
                  <Input label="Tên đăng nhập" value={username} onChangeText={setUsername} autoCapitalize="none" />
                )}
                <Input label="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry placeholder={editingStaff ? "Để trống nếu không đổi" : ""} />
                <Input label="Lương (VNĐ)" value={luong} onChangeText={setLuong} keyboardType="numeric" />

                <Text style={styles.label}>Quyền</Text>
                <View style={styles.quyenGrid}>
                  {ALL_QUYEN.map(q => (
                    <TouchableOpacity key={q.key} style={[styles.quyenChip, quyen.includes(q.key) && styles.quyenChipActive]} onPress={() => toggleQuyen(q.key)}>
                      <Text style={[styles.quyenChipText, quyen.includes(q.key) && { color: colors.cream }]}>{q.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.switchRow}>
                  <Text style={styles.label}>Còn hoạt động</Text>
                  <Switch value={conHoatDong} onValueChange={setConHoatDong} />
                </View>

                <View style={styles.modalButtons}>
                  <Button title="Hủy" onPress={() => setShowAdd(false)} variant="ghost" style={{ flex: 1 }} />
                  <Button title="Lưu" onPress={handleSave} style={{ flex: 1 }} />
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmDialog visible={!!deleteId} title="Xóa nhân viên?" message="Hành động này không thể hoàn tác." confirmText="Xóa" isDanger onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: legacyColors.cream },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: legacyColors.white, borderBottomWidth: 1, borderBottomColor: legacyColors.stone[200] },
  title: { fontSize: 18, fontWeight: "300", letterSpacing: 2, color: legacyColors.espresso },
  addBtn: { padding: 10, backgroundColor: legacyColors.espresso, borderRadius: 8 },
  list: { padding: 12, gap: 12 },
  card: { backgroundColor: legacyColors.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: legacyColors.stone[300] },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: legacyColors.espresso, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 16, fontWeight: "700", color: legacyColors.cream },
  name: { fontSize: 14, fontWeight: "600", color: legacyColors.espresso },
  usernameRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  username: { fontSize: 12, fontWeight: "600", color: legacyColors.blush, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  quyenRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 8 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  salary: { fontSize: 12, fontWeight: "600", color: legacyColors.espresso },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: legacyColors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "600", color: legacyColors.espresso, marginBottom: 16 },
  label: { fontSize: 10, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", color: legacyColors.stone[600], marginBottom: 6 },
  quyenGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  quyenChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: legacyColors.stone[300] },
  quyenChipActive: { backgroundColor: legacyColors.espresso, borderColor: legacyColors.espresso },
  quyenChipText: { fontSize: 11, color: legacyColors.stone[500] },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 8 },
  readonlyField: { marginBottom: 12 },
  readonlyLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", color: legacyColors.stone[600], marginBottom: 6 },
  readonlyValueWrap: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: legacyColors.cream, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: legacyColors.stone[200] },
  readonlyValue: { fontSize: 14, fontWeight: "600", color: legacyColors.espresso, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
});
