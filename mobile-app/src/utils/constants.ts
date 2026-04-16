import Constants from 'expo-constants';

// API URL — production
export const API_URL = 'https://tastore.vercel.app';
// export const API_URL = 'http://localhost:3000';

export const APP_NAME = 'TRANG ANH STORE';

export const ORDER_STATUSES = [
  'Mới',
  'Chốt để lên đơn',
  'Đã lên đơn',
  'Đang xử lý',
  'Đã giao',
  'Huỷ',
] as const;

export const STATUS_COLORS: Record<string, string> = {
  'Mới': '#3B82F6',
  'Chốt để lên đơn': '#8B5CF6',
  'Đã lên đơn': '#14B8A6',
  'Đang xử lý': '#F59E0B',
  'Đã giao': '#22C55E',
  'Huỷ': '#A8705F',
};

export const STATUS_COLORS_BG: Record<string, string> = {
  'Mới': '#DBEAFE',
  'Chốt để lên đơn': '#EDE9FE',
  'Đã lên đơn': '#CCFBF1',
  'Đang xử lý': '#FEF3C7',
  'Đã giao': '#DCFCE7',
  'Huỷ': '#FCE7E7',
};

export const QUICK_SIZES = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL',
  '36', '37', '38', '39', '40', '41', '42',
];

export const LIMIT_DEFAULT = 20;
