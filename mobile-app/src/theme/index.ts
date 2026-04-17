// Design tokens — match web exactly
export const colors = {
  cream: '#EDE8DF',
  blush: '#C8A991',
  rose: '#A8705F',
  espresso: '#1A0A04',
  white: '#FFFFFF',
  stone: {
    100: '#EDE8DF',
    200: '#D9C9BC',
    300: '#C4A896',
    400: '#7A5A4E',
    500: '#4A3028',
    600: '#4A2E24',
    700: '#3C2E28',
    800: '#2A1F1A',
    900: '#1A0A04',
  },
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#D97706',
  info: '#2563EB',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const typography = {
  heading: {
    fontFamily: 'CormorantGaramond',
    fontWeight: '300' as const,
    letterSpacing: 2,
  },
  body: {
    fontFamily: 'DMSans',
  },
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    '2xl': 24,
    '3xl': 32,
  },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
};
