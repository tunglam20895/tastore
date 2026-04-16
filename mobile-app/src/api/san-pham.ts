import { apiClient } from './client';
import type { SanPham, PaginatedResponse, DanhMuc } from '@/src/types';
import Toast from 'react-native-toast-message';

export async function getProducts(params: {
  page: number;
  limit: number;
  search?: string;
  danh_muc?: string;
  ton_kho?: string;
  con_hang?: string;
}) {
  const res = await apiClient.get('/api/san-pham', { params });
  return res.data;
}

export async function getProduct(id: string) {
  const res = await apiClient.get(`/api/san-pham/${id}`);
  const body = res.data as any;
  if (body?.success && body?.data) return body.data;
  return res.data;
}

export async function createProduct(data: Record<string, unknown>) {
  const res = await apiClient.post('/api/san-pham', data);
  Toast.show({
    type: 'success',
    text1: '✅ Đã thêm',
    text2: `Sản phẩm "${data.ten}" đã được tạo`,
    position: 'top',
    visibilityTime: 2000,
    topOffset: 60,
  });
  return res.data;
}

export async function updateProduct(id: string, data: Record<string, unknown>) {
  const res = await apiClient.put(`/api/san-pham/${id}`, data);
  Toast.show({
    type: 'success',
    text1: '✅ Đã cập nhật',
    text2: `Sản phẩm "${data.ten}" đã được lưu`,
    position: 'top',
    visibilityTime: 2000,
    topOffset: 60,
  });
  return res.data;
}

export async function deleteProduct(id: string) {
  const res = await apiClient.delete(`/api/san-pham/${id}`);
  Toast.show({
    type: 'success',
    text1: '🗑️ Đã xóa',
    text2: 'Sản phẩm đã được xóa',
    position: 'top',
    visibilityTime: 2000,
    topOffset: 60,
  });
  return res.data;
}

export async function getCategories() {
  const res = await apiClient.get('/api/danh-muc');
  return res.data;
}

export async function uploadImage(uri: string, folder?: string) {
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: uri.split('/').pop() || 'upload.jpg',
  } as any);
  if (folder) formData.append('folder', folder);

  const res = await apiClient.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function generateMoTa(ten: string, gia: number, danhMuc: string) {
  const res = await apiClient.post('/api/generate-mo-ta', { ten, gia, danhMuc });
  return res.data;
}
