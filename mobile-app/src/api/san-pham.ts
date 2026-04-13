import { apiClient } from './client';
import type { SanPham, PaginatedResponse, DanhMuc } from '@/src/types';

export async function getProducts(params: {
  page: number;
  limit: number;
  search?: string;
  danh_muc?: string;
  ton_kho?: string;
  con_hang?: string;
}) {
  const res = await apiClient.get<PaginatedResponse<SanPham>>('/api/san-pham', { params });
  return res.data;
}

export async function getProduct(id: string) {
  const res = await apiClient.get<SanPham>(`/api/san-pham/${id}`);
  return res.data;
}

export async function createProduct(data: Record<string, unknown>) {
  const res = await apiClient.post<SanPham>('/api/san-pham', data);
  return res.data;
}

export async function updateProduct(id: string, data: Record<string, unknown>) {
  const res = await apiClient.put<SanPham>(`/api/san-pham/${id}`, data);
  return res.data;
}

export async function deleteProduct(id: string) {
  const res = await apiClient.delete(`/api/san-pham/${id}`);
  return res.data;
}

export async function getCategories() {
  const res = await apiClient.get<DanhMuc[]>('/api/danh-muc');
  return res.data;
}

export async function uploadImage(uri: string) {
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: uri.split('/').pop() || 'upload.jpg',
  } as any);

  const res = await apiClient.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function generateMoTa(ten: string, gia: number, danhMuc: string) {
  const res = await apiClient.post('/api/generate-mo-ta', { ten, gia, danhMuc });
  return res.data;
}
