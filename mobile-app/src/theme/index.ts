// Trang Anh Store Design System
// Material Design 3 inspired color tokens

export const colors = {
  // Primary Colors
  primary: '#000000',
  'on-primary': '#ffffff',
  'primary-container': '#1c1b1b',
  'on-primary-container': '#858383',
  'primary-fixed': '#e5e2e1',
  'on-primary-fixed': '#1c1b1b',
  'primary-fixed-dim': '#c8c6c5',
  'on-primary-fixed-variant': '#474746',
  'inverse-primary': '#c8c6c5',

  // Secondary Colors (Gold/Beige accent)
  secondary: '#775a19',
  'on-secondary': '#ffffff',
  'secondary-container': '#fed488',
  'on-secondary-container': '#785a1a',
  'secondary-fixed': '#ffdea5',
  'on-secondary-fixed': '#261900',
  'secondary-fixed-dim': '#e9c176',
  'on-secondary-fixed-variant': '#5d4201',

  // Tertiary Colors
  tertiary: '#000000',
  'on-tertiary': '#ffffff',
  'tertiary-container': '#1c1c17',
  'on-tertiary-container': '#86847d',
  'tertiary-fixed': '#e6e2da',
  'on-tertiary-fixed': '#1c1c17',
  'tertiary-fixed-dim': '#c9c6bf',
  'on-tertiary-fixed-variant': '#484741',

  // Surface Colors
  background: '#fbf9f9',
  'on-background': '#1b1c1c',
  surface: '#fbf9f9',
  'on-surface': '#1b1c1c',
  'surface-variant': '#e4e2e2',
  'on-surface-variant': '#444748',
  'surface-dim': '#dbdad9',
  'surface-bright': '#fbf9f9',
  'surface-container-lowest': '#ffffff',
  'surface-container-low': '#f5f3f3',
  'surface-container': '#efeded',
  'surface-container-high': '#e9e8e7',
  'surface-container-highest': '#e4e2e2',
  'surface-tint': '#5f5e5e',
  'inverse-surface': '#303031',
  'inverse-on-surface': '#f2f0f0',

  // Outline
  outline: '#747878',
  'outline-variant': '#c4c7c7',

  // Error Colors
  error: '#ba1a1a',
  'on-error': '#ffffff',
  'error-container': '#ffdad6',
  'on-error-container': '#93000a',

  // Brand Background (from HTML styles)
  brandBg: '#F5F1E9',
  brandText: '#1A1A1A',
};

export const spacing = {
  base: 4,
  xs: 8,
  sm: 16,
  md: 24,
  lg: 40,
  xl: 64,
};

export const borderRadius = {
  DEFAULT: 2,
  lg: 4,
  xl: 8,
  full: 12,
};

export const typography = {
  fontFamily: {
    'body-md': 'WorkSans',
    'body-lg': 'WorkSans',
    'label-sm': 'WorkSans',
    h1: 'NotoSerif',
    h2: 'NotoSerif',
  },
  fontSize: {
    'body-md': 14,
    'body-lg': 16,
    'label-sm': 12,
    h1: 32,
    h2: 24,
  },
  lineHeight: {
    'body-md': 21, // 1.5 * 14
    'body-lg': 25.6, // 1.6 * 16
    'label-sm': 12, // 1 * 12
    h1: 38.4, // 1.2 * 32
    h2: 31.2, // 1.3 * 24
  },
  fontWeight: {
    'body-md': '400' as const,
    'body-lg': '400' as const,
    'label-sm': '600' as const,
    h1: '600' as const,
    h2: '500' as const,
  },
  letterSpacing: {
    'label-sm': 0.6, // 0.05em * 12px
    normal: 0,
  },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  luxury: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 3,
  },
  navbar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 8,
  },
};

// Navigation structure matching HTML designs
export const navigation = {
  bottomNav: [
    {
      name: 'Dashboard',
      icon: 'dashboard',
      route: '/(admin)/dashboard',
    },
    {
      name: 'Đơn hàng',
      icon: 'receipt_long',
      route: '/(admin)/don-hang',
    },
    {
      name: 'Sản phẩm',
      icon: 'checkroom',
      route: '/(admin)/san-pham',
    },
    {
      name: 'Khách hàng',
      icon: 'group',
      route: '/(admin)/khach-hang',
    },
    {
      name: 'Cài đặt',
      icon: 'settings',
      route: '/(admin)/more',
    },
  ],
};
