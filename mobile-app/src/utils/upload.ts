import { API_URL } from '@/src/utils/constants';
import { useAuthStore } from '@/src/store/authStore';
/**
 * Upload ảnh lên server sử dụng FormData + XMLHttpRequest.
 * Axios không hỗ trợ multipart/file upload đúng cách trên React Native.
 */
export async function uploadImage(
  uri: string,
  bucket: string = 'san-pham-images'
): Promise<{ success: boolean; url?: string; error?: string }> {
  const state = useAuthStore.getState();

  return new Promise((resolve) => {
    // Tạo FormData
    const formData = new FormData();
    
    // Lấy file name từ URI
    const fileName = uri.split('/').pop() || 'upload.jpg';
    const fileType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';

    // Append file — React Native FormData cần object với uri, name, type
    formData.append('file' as any, {
      uri,
      name: fileName,
      type: fileType,
    } as any);
    formData.append('bucket', bucket);

    // Build URL
    const url = `${API_URL}/api/upload`;

    // Tạo XMLHttpRequest
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (response.success) {
          resolve({ success: true, url: response.data?.url });
        } else {
          resolve({ success: false, error: response.error || 'Upload thất bại' });
        }
      } catch {
        resolve({ success: false, error: 'Không thể parse response' });
      }
    };

    xhr.onerror = () => {
      resolve({ success: false, error: 'Lỗi kết nối' });
    };

    xhr.open('POST', url);

    // Set auth headers
    if (state.role === 'admin' && state.adminPassword) {
      xhr.setRequestHeader('x-admin-password', state.adminPassword);
    } else if (state.role === 'staff' && state.staffToken) {
      xhr.setRequestHeader('staff-token', state.staffToken);
    }

    // Không set Content-Type — browser sẽ tự động set với boundary
    // Gửi request
    xhr.send(formData);
  });
}

/**
 * Upload ảnh từ camera roll sau khi compress.
 * Trả về URL ảnh đã upload.
 */
export async function uploadImageFromPicker(
  uri: string,
  bucket: string = 'san-pham-images'
): Promise<string | null> {
  const result = await uploadImage(uri, bucket);
  if (result.success && result.url) {
    return result.url;
  }
  return null;
}
