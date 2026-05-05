import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, FlatList, Modal,
} from "react-native";
import { showSuccess, showError, showInfo } from "@/src/utils/toast";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProducts } from "@/src/api/san-pham";
import { getCustomers } from "@/src/api/khach-hang";
import { createOrder } from "@/src/api/don-hang";
import { apiClient } from "@/src/api/client";
import { useAuthStore } from "@/src/store/authStore";
import { colors, shadows, borderRadius } from "@/src/theme";
import { legacyColors } from '@/src/theme/legacy-colors';
import { formatMoney } from "@/src/utils/format";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";
import Button from "@/src/components/ui/Button";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

type CartItem = {
  id: string;
  ten: string;
  giaHienThi: number;
  anhURL: string;
  sizeChon?: string;
  soLuong: number;
};

export default function CreateOrderScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { role } = useAuthStore();
  const isAdmin = role === "admin";

  // Customer
  const [tenKH, setTenKH] = useState("");
  const [sdt, setSdt] = useState("");
  const [diaChi, setDiaChi] = useState("");
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  // Product
  const [searchProduct, setSearchProduct] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedSize, setSelectedSize] = useState("");

  // Coupon
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Submit
  const [submitting, setSubmitting] = useState(false);

  // Fetch customers for search
  const { data: customersData } = useQuery({
    queryKey: ["customers-search", customerSearch],
    queryFn: () => getCustomers({ page: 1, limit: 10, search: customerSearch }),
    enabled: showCustomerSearch && customerSearch.length >= 1,
  });
  const customers = (customersData as any)?.data || customersData || [];

  // Fetch products for search
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["products-search", searchProduct],
    queryFn: () => getProducts({ page: 1, limit: 20, search: searchProduct }),
    enabled: searchProduct.length >= 2,
  });
  const products = (productsData as any)?.data || productsData || [];

  // Totals
  const subtotal = cart.reduce((sum, item) => sum + item.giaHienThi * item.soLuong, 0);
  const discount = appliedCoupon?.giaTriGiam || 0;
  const total = Math.max(0, subtotal - discount);

  const selectCustomer = (kh: any) => {
    setTenKH(kh.ten);
    setSdt(kh.sdt);
    setDiaChi(kh.diaChi || "");
    setShowCustomerSearch(false);
    setCustomerSearch("");
  };

  const openProductModal = (product: any) => {
    setSelectedProduct(product);
    const sizes = (product.sizes as any[]) || [];
    setSelectedSize(sizes.length > 0 ? sizes[0].ten : "");
    setShowProductModal(true);
  };

  const addToCart = () => {
    if (!selectedProduct) return;
    const existing = cart.find(c => c.id === selectedProduct.id && c.sizeChon === selectedSize);
    if (existing) {
      setCart(prev => prev.map(c =>
        c.id === existing.id && c.sizeChon === existing.sizeChon
          ? { ...c, soLuong: c.soLuong + 1 }
          : c
      ));
    } else {
      setCart(prev => [...prev, {
        id: selectedProduct.id,
        ten: selectedProduct.ten,
        giaHienThi: selectedProduct.giaHienThi || selectedProduct.giaGoc || 0,
        anhURL: selectedProduct.anhURL || "",
        sizeChon: selectedSize || undefined,
        soLuong: 1,
      }]);
    }
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  const updateCartQty = (idx: number, delta: number) => {
    setCart(prev => prev.map((c, i) => {
      if (i === idx) {
        const newQty = c.soLuong + delta;
        return newQty <= 0 ? null : { ...c, soLuong: newQty };
      }
      return c;
    }).filter(Boolean) as CartItem[]);
  };

  const applyCoupon = useCallback(async () => {
    if (!couponCode.trim()) return;
    setCouponError("");
    setApplyingCoupon(true);
    try {
      const res = await apiClient.post("/api/ma-giam-gia/kiem-tra", {
        ma: couponCode.trim().toUpperCase(),
        tongTien: subtotal,
      });
      if (res.data?.success && res.data?.data?.giaTriGiam) {
        setAppliedCoupon(res.data.data);
        setCouponError("");
      } else {
        setCouponError(res.data?.error || "Mã giảm giá không hợp lệ");
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError("Không thể kiểm tra mã giảm giá");
    } finally {
      setApplyingCoupon(false);
    }
  }, [couponCode, subtotal]);

  const handleSubmit = async () => {
    if (!tenKH.trim()) { showInfo("Nhập tên khách hàng"); return; }
    if (!sdt.trim()) { showInfo("Nhập số điện thoại"); return; }
    if (!diaChi.trim()) { showInfo("Nhập địa chỉ"); return; }
    if (cart.length === 0) { showInfo("Thêm ít nhất 1 sản phẩm"); return; }

    setSubmitting(true);
    try {
      await createOrder({
        tenKH: tenKH.trim(),
        sdt: sdt.trim(),
        diaChi: diaChi.trim(),
        sanPham: cart.map(c => ({
          id: c.id,
          ten: c.ten,
          giaHienThi: c.giaHienThi,
          sizeChon: c.sizeChon || null,
          soLuong: c.soLuong,
        })),
        tongTien: subtotal,
        maGiamGia: appliedCoupon?.maInfo?.ma || null,
        ghiChu: null,
      });

      queryClient.invalidateQueries({ queryKey: ["orders"] });
      showSuccess("Đã tạo đơn hàng thành công");
      router.replace("/(admin)/don-hang");
    } catch (err: any) {
      showError(err?.response?.data?.error || "Không thể tạo đơn hàng");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={legacyColors.espresso} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo đơn hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Customer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Khách hàng</Text>
          <TouchableOpacity style={styles.searchBar} onPress={() => setShowCustomerSearch(true)} activeOpacity={0.7}>
            <Ionicons name="search" size={18} color={legacyColors.stone[400]} />
            <Text style={styles.searchText}>{tenKH || "Tìm khách hàng..."}</Text>
          </TouchableOpacity>

          <View style={styles.inputRow}>
            <TextInput style={styles.input} value={tenKH} onChangeText={setTenKH} placeholder="Họ và tên" placeholderTextColor={legacyColors.stone[300]} />
          </View>
          <View style={styles.inputRow}>
            <TextInput style={styles.input} value={sdt} onChangeText={setSdt} placeholder="Số điện thoại" keyboardType="phone-pad" placeholderTextColor={legacyColors.stone[300]} />
          </View>
          <View style={styles.inputRow}>
            <TextInput style={styles.input} value={diaChi} onChangeText={setDiaChi} placeholder="Địa chỉ giao hàng" placeholderTextColor={legacyColors.stone[300]} multiline numberOfLines={2} />
          </View>
        </View>

        {/* Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🛒 Sản phẩm ({cart.length})</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setSearchProduct("")} activeOpacity={0.7}>
              <Ionicons name="add" size={20} color={colors.cream} />
            </TouchableOpacity>
          </View>

          {/* Product search */}
          {searchProduct !== undefined && (
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={legacyColors.stone[400]} />
              <TextInput
                style={styles.searchInput}
                value={searchProduct}
                onChangeText={setSearchProduct}
                placeholder="Tìm sản phẩm..."
                placeholderTextColor={legacyColors.stone[300]}
                autoFocus
              />
              {searchProduct.length > 0 && (
                <TouchableOpacity onPress={() => setSearchProduct("")}>
                  <Ionicons name="close-circle" size={18} color={legacyColors.stone[300]} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {searchProduct.length >= 2 && (
            <View style={styles.productList}>
              {loadingProducts ? (
                <LoadingSpinner size="sm" label="Đang tìm..." />
              ) : products.length === 0 ? (
                <Text style={styles.emptyText}>Không tìm thấy sản phẩm</Text>
              ) : (
                products.map((sp: any) => (
                  <TouchableOpacity key={sp.id} style={styles.productItem} onPress={() => openProductModal(sp)} activeOpacity={0.7}>
                    {sp.anhURL ? (
                      <Image source={{ uri: sp.anhURL }} style={styles.productThumb} contentFit="cover" transition={200} cachePolicy="memory-disk" />
                    ) : (
                      <View style={[styles.productThumb, styles.productThumbPlaceholder]}>
                        <Ionicons name="shirt-outline" size={24} color={legacyColors.stone[300]} />
                      </View>
                    )}
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={2}>{sp.ten}</Text>
                      <Text style={styles.productPrice}>{formatMoney(sp.giaHienThi || sp.giaGoc || 0)}</Text>
                    </View>
                    <Ionicons name="add-circle" size={24} color={colors.blush} />
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* Cart items */}
          {cart.length > 0 && (
            <View style={styles.cartList}>
              {cart.map((item, idx) => (
                <View key={`${item.id}-${item.sizeChon}`} style={styles.cartItem}>
                  {item.anhURL ? (
                    <Image source={{ uri: item.anhURL }} style={styles.cartThumb} contentFit="cover" transition={200} cachePolicy="memory-disk" />
                  ) : (
                    <View style={[styles.cartThumb, styles.cartThumbPlaceholder]}>
                      <Ionicons name="shirt-outline" size={18} color={legacyColors.stone[300]} />
                    </View>
                  )}
                  <View style={styles.cartInfo}>
                    <Text style={styles.cartName} numberOfLines={1}>{item.ten}</Text>
                    {item.sizeChon && <Text style={styles.cartSize}>Size: {item.sizeChon}</Text>}
                    <Text style={styles.cartPrice}>{formatMoney(item.giaHienThi)}</Text>
                  </View>
                  <View style={styles.qtyControl}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateCartQty(idx, -1)}>
                      <Ionicons name="remove" size={18} color={colors.espresso} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.soLuong}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => updateCartQty(idx, 1)}>
                      <Ionicons name="add" size={18} color={colors.espresso} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Coupon */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏷️ Mã giảm giá</Text>
          <View style={styles.couponRow}>
            <TextInput style={styles.couponInput} value={couponCode} onChangeText={setCouponCode} placeholder="Nhập mã giảm giá" placeholderTextColor={legacyColors.stone[300]} />
            <Button title={applyingCoupon ? "..." : "Áp dụng"} onPress={applyCoupon} disabled={!couponCode.trim() || applyingCoupon} style={styles.couponBtn} />
          </View>
          {couponError ? <Text style={styles.errorText}>{couponError}</Text> : null}
          {appliedCoupon && (
            <View style={styles.couponSuccess}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.couponSuccessText}>Đã áp dụng: {appliedCoupon.maInfo?.ma} (-{formatMoney(discount)})</Text>
            </View>
          )}
        </View>

        {/* Totals */}
        <View style={[styles.section, styles.totalSection]}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tạm tính</Text>
            <Text style={styles.totalValue}>{formatMoney(subtotal)}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.success }]}>Giảm giá</Text>
              <Text style={[styles.totalValue, { color: colors.success }]}>-{formatMoney(discount)}</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>Tổng thanh toán</Text>
            <Text style={styles.grandTotalValue}>{formatMoney(total)}</Text>
          </View>
        </View>

        <Button title="✅ Tạo đơn hàng" onPress={handleSubmit} loading={submitting} style={styles.submitBtn} />
      </ScrollView>

      {/* Customer Search Modal */}
      <Modal visible={showCustomerSearch} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn khách hàng</Text>
              <TouchableOpacity onPress={() => setShowCustomerSearch(false)}>
                <Ionicons name="close" size={24} color={legacyColors.stone[500]} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={legacyColors.stone[400]} />
              <TextInput style={styles.searchInput} value={customerSearch} onChangeText={setCustomerSearch} placeholder="Tìm theo tên hoặc SĐT..." placeholderTextColor={legacyColors.stone[300]} autoFocus />
            </View>
            <FlatList
              data={customers}
              keyExtractor={(item: any) => item.sdt}
              renderItem={({ item }: any) => (
                <TouchableOpacity style={styles.customerItem} onPress={() => selectCustomer(item)} activeOpacity={0.7}>
                  <Text style={styles.customerName}>{item.ten}</Text>
                  <Text style={styles.customerSdt}>{item.sdt}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>{customerSearch ? "Không tìm thấy" : "Nhập tên hoặc SĐT để tìm..."}</Text>}
              style={{ maxHeight: 300 }}
            />
          </View>
        </View>
      </Modal>

      {/* Product Size Modal */}
      <Modal visible={showProductModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowProductModal(false)}>
          <View style={styles.modalContent} pointerEvents="box-none">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn size</Text>
              <TouchableOpacity onPress={() => setShowProductModal(false)}>
                <Ionicons name="close" size={24} color={legacyColors.stone[500]} />
              </TouchableOpacity>
            </View>
            {selectedProduct && (
              <>
                <Text style={styles.modalProductName}>{selectedProduct.ten}</Text>
                <View style={styles.sizeGrid}>
                  {(selectedProduct.sizes || []).map((s: any) => (
                    <TouchableOpacity
                      key={s.ten}
                      style={[styles.sizeChip, selectedSize === s.ten && styles.sizeChipActive]}
                      onPress={() => setSelectedSize(s.ten)}
                    >
                      <Text style={[styles.sizeChipText, selectedSize === s.ten && styles.sizeChipTextActive]}>
                        {s.ten}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[styles.sizeChip, !selectedSize && styles.sizeChipActive]}
                    onPress={() => setSelectedSize("")}
                  >
                    <Text style={[styles.sizeChipText, !selectedSize && styles.sizeChipTextActive]}>Không size</Text>
                  </TouchableOpacity>
                </View>
                <Button title="Thêm vào giỏ" onPress={addToCart} style={{ marginTop: 16 }} />
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: legacyColors.cream },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: legacyColors.white,
    borderBottomWidth: 1,
    borderBottomColor: `${legacyColors.stone[200]}40`,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: legacyColors.espresso },
  scroll: { padding: 12, paddingBottom: 32, gap: 12 },
  section: { backgroundColor: legacyColors.white, borderRadius: borderRadius.md, padding: 16, ...shadows.card },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: legacyColors.espresso, marginBottom: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  addBtn: { padding: 8, backgroundColor: legacyColors.espresso, borderRadius: borderRadius.sm },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: legacyColors.cream,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
    gap: 8,
  },
  searchText: { fontSize: 14, color: legacyColors.stone[400] },
  searchInput: { flex: 1, fontSize: 14, color: legacyColors.espresso },
  inputRow: { marginBottom: 8 },
  input: { backgroundColor: legacyColors.cream, borderRadius: borderRadius.sm, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: legacyColors.espresso },
  emptyText: { fontSize: 13, color: legacyColors.stone[400], textAlign: "center", padding: 16 },

  // Product list
  productList: { gap: 8, marginBottom: 8 },
  productItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, backgroundColor: legacyColors.cream, borderRadius: borderRadius.sm },
  productThumb: { width: 48, height: 48, borderRadius: 8 },
  productThumbPlaceholder: { backgroundColor: `${legacyColors.stone[100]}80`, justifyContent: "center", alignItems: "center" },
  productInfo: { flex: 1 },
  productName: { fontSize: 13, fontWeight: "600", color: legacyColors.espresso },
  productPrice: { fontSize: 12, color: legacyColors.blush, fontWeight: "600" },

  // Cart
  cartList: { gap: 8 },
  cartItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: `${legacyColors.stone[100]}60` },
  cartThumb: { width: 40, height: 40, borderRadius: 8 },
  cartThumbPlaceholder: { backgroundColor: `${legacyColors.stone[100]}80`, justifyContent: "center", alignItems: "center" },
  cartInfo: { flex: 1 },
  cartName: { fontSize: 13, fontWeight: "600", color: legacyColors.espresso },
  cartSize: { fontSize: 11, color: legacyColors.stone[400] },
  cartPrice: { fontSize: 12, color: legacyColors.blush, fontWeight: "600" },
  qtyControl: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: { padding: 4 },
  qtyText: { fontSize: 14, fontWeight: "700", color: legacyColors.espresso, minWidth: 20, textAlign: "center" },

  // Coupon
  couponRow: { flexDirection: "row", gap: 8 },
  couponInput: { flex: 1, backgroundColor: legacyColors.cream, borderRadius: borderRadius.sm, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: legacyColors.espresso },
  couponBtn: { minWidth: 80 },
  errorText: { fontSize: 12, color: legacyColors.danger, marginTop: 6 },
  couponSuccess: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  couponSuccessText: { fontSize: 12, color: legacyColors.success, fontWeight: "600" },

  // Totals
  totalSection: { backgroundColor: `${legacyColors.blush}08` },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  divider: { height: 1, backgroundColor: legacyColors.stone[200], marginVertical: 4 },
  totalLabel: { fontSize: 13, color: legacyColors.stone[500] },
  totalValue: { fontSize: 13, fontWeight: "600", color: legacyColors.espresso },
  grandTotalLabel: { fontSize: 15, fontWeight: "700", color: legacyColors.espresso },
  grandTotalValue: { fontSize: 18, fontWeight: "800", color: legacyColors.rose },
  submitBtn: { marginTop: 8 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: legacyColors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, ...shadows.card },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: "700", color: legacyColors.espresso },
  modalProductName: { fontSize: 14, fontWeight: "600", color: legacyColors.espresso, marginBottom: 12 },
  customerItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: legacyColors.stone[100] },
  customerName: { fontSize: 14, fontWeight: "600", color: legacyColors.espresso },
  customerSdt: { fontSize: 12, color: legacyColors.stone[400] },
  sizeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sizeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: legacyColors.stone[300], backgroundColor: legacyColors.white },
  sizeChipActive: { backgroundColor: legacyColors.espresso, borderColor: legacyColors.espresso },
  sizeChipText: { fontSize: 12, color: legacyColors.stone[500], fontWeight: "500" },
  sizeChipTextActive: { color: legacyColors.cream },
});
