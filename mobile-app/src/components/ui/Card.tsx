import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, type ViewStyle } from 'react-native';
import { shadows } from '@/src/theme';
import { legacyColors } from '@/src/theme/legacy-colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export default function Card({ children, style, onPress }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity 
        style={[styles.card, style]} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: legacyColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: legacyColors.stone[300],
    padding: 16,
    ...shadows.card,
  },
});
