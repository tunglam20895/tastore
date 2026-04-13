import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, shadows } from '@/src/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export default function Card({ children, style, onPress }: CardProps) {
  const Container = onPress ? React.Fragment : View;

  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.stone[300],
    padding: 16,
    ...shadows.card,
  },
});
