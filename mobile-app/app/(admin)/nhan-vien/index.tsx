import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, RefreshControl, Modal, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getStaff, createStaff, updateStaff, deleteStaff } from "@/src/api/nhan-vien";
import { colors } from "@/src/theme";
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
    if (!ten || (!editingStaff && !username) || (!editingStaff && !password)) {
      showError("Điền đủ thông tin"); return;
    }
    try {
      const d: Record<string, unknown> = { ten, quyen, luong: parseFloat(luong) || 0, con_hoat_dong: conHoatDong };
      if (!editingStaff) { d.username = username; d.password = password; }
      if (editingStaff) {
        if (password) d.password = password;
        await updateStaff(editingStaff.id, d);
      } else {
        await createStaff(d);
      }
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setShowAdd(false);
      showSuccess(editingStaff ? "Đã cập nhật" : "Đã thêm nhân viên");
    } catch {
      showError("Không thể lưu");
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

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => openEdit(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.ten[0] || "?").toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.name}>{item.ten}</Text>
          <Text style={styles.username}>{item.username}</Text>
        </View>
        <Switch value={item.conHoatDong} onValueChange={() => {
          updateStaff(item.id, { con_hoat_dong: !item.conHoatDong }).then(() => queryClient.invalidateQueries({ queryKey: ["staff"] }));
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
          <Ionicons name="trash" size={16} color={colors.rose} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nhân viên</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={20} color={colors.cream} />
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
                {!editingStaff && <Input label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />}
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
  container: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.stone[200] },
  title: { fontSize: 18, fontWeight: "300", letterSpacing: 2, color: colors.espresso },
  addBtn: { padding: 10, backgroundColor: colors.espresso, borderRadius: 8 },
  list: { padding: 12, gap: 12 },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.stone[300] },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.espresso, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 16, fontWeight: "700", color: colors.cream },
  name: { fontSize: 14, fontWeight: "600", color: colors.espresso },
  username: { fontSize: 12, color: colors.stone[400] },
  quyenRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 8 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  salary: { fontSize: 12, fontWeight: "600", color: colors.espresso },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "600", color: colors.espresso, marginBottom: 16 },
  label: { fontSize: 10, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", color: colors.stone[600], marginBottom: 6 },
  quyenGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  quyenChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.stone[300] },
  quyenChipActive: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  quyenChipText: { fontSize: 11, color: colors.stone[500] },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 8 },
});
