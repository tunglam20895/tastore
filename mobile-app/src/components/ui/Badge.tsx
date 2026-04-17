import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/src/theme';

interface BadgeProps {
  text: string;
  color?: string;
  bgColor?: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'custom';
}

const variantStyles: Record<string, { color: string; bgColor: string }> = {
  success: { color: colors.success, bgColor: '#DCFCE7' },
  warning: { color: colors.warning, bgColor: '#FEF3C7' },
  danger: { color: colors.danger, bgColor: '#FEE2E2' },
  info: { color: colors.info, bgColor: '#DBEAFE' },
  custom: { color: colors.stone[500], bgColor: colors.stone[100] },
};

export default function Badge({ text, color, bgColor, variant = 'custom' }: BadgeProps) {
  const style = variantStyles[variant];
  const finalColor = color || style.color;
  const finalBg = bgColor || style.bgColor;

  return (
    <View style={[styles.badge, { backgroundColor: finalBg }]}>
      <Text style={[styles.text, { color: finalColor }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
