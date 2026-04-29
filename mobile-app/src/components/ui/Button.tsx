import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import { legacyColors } from '@/src/theme/legacy-colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const bgColors: Record<string, string> = {
    primary: legacyColors.espresso,
    secondary: legacyColors.blush,
    ghost: 'transparent',
    danger: legacyColors.danger,
  };

  const textColors: Record<string, string> = {
    primary: legacyColors.cream,
    secondary: legacyColors.espresso,
    ghost: legacyColors.stone[500],
    danger: legacyColors.white,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        {
          backgroundColor: bgColors[variant],
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: variant === 'ghost' ? legacyColors.stone[300] : 'transparent',
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColors[variant]} size="small" />
      ) : (
        <Text style={[styles.text, { color: textColors[variant] }]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
