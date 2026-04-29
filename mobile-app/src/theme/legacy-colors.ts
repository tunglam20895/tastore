// Legacy color mapping for backward compatibility
// Maps old color names to new Material Design 3 tokens

import { colors } from './index';

export const legacyColors = {
  // Old color scheme
  cream: colors.brandBg, // '#EDE8DF' -> '#F5F1E9'
  blush: colors.secondary, // '#C8A991' -> '#775a19'
  rose: colors.secondary, // '#A8705F' -> '#775a19'
  espresso: colors.primary, // '#1A0A04' -> '#000000'
  white: colors['surface-container-lowest'], // '#FFFFFF'
  
  // Old stone palette
  stone: {
    100: colors['surface-container-low'], // '#EDE8DF' -> '#f5f3f3'
    200: colors['outline-variant'], // '#D9C9BC' -> '#c4c7c7'
    300: colors['on-surface-variant'], // '#C4A896' -> '#444748'
    400: colors['on-surface-variant'], // '#7A5A4E' -> '#444748'
    500: colors['on-surface'], // '#4A3028' -> '#1b1c1c'
    600: colors['primary-container'], // '#4A2E24' -> '#1c1b1b'
    700: colors['primary-container'], // '#3C2E28' -> '#1c1b1b'
    800: colors['inverse-surface'], // '#2A1F1A' -> '#303031'
    900: colors.primary, // '#1A0A04' -> '#000000'
  },
  
  // Status colors (keep these)
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#D97706',
  info: '#2563EB',
};
