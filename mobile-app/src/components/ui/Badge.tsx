import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { legacyColors } from '@/src/theme/legacy-colors';

interface BadgeProps {
  text: string;
  color?: string;
  bgColor?: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'custom';
}

const variantStyles: Record<string, { color: string; bgColor: string }> = {
  success: { color: legacyColors.success, bgColor: '#DCFCE7' },
  warning: { color: legacyColors.warning, bgColor: '#FEF3C7' },
  danger: { color: legacyColors.danger, bgColor: '#FEE2E2' },
  info: { color: legacyColors.info, bgColor: '#DBEAFE' },
  custom: { color: legacyColors.stone[500], bgColor: legacyColors.stone[100] },
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
