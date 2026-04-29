import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { legacyColors } from '@/src/theme/legacy-colors';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'full';
  label?: string;
}

export default function LoadingSpinner({ size = 'md', label }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'small' as const,
    md: 'large' as const,
    lg: 'large' as const,
    full: 'large' as const,
  };

  const fontSize = {
    sm: 10,
    md: 12,
    lg: 14,
    full: 16,
  }[size];

  if (size === 'full') {
    return (
      <View style={styles.fullContainer}>
        <ActivityIndicator size="large" color={legacyColors.espresso} />
        {label && <Text style={[styles.fullLabel, { fontSize }]}>{label}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={sizes[size]} color={legacyColors.espresso} />
      {label && <Text style={[styles.label, { fontSize }]}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
  },
  fullContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: legacyColors.cream,
  },
  label: {
    marginTop: 8,
    color: legacyColors.stone[400],
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  fullLabel: {
    marginTop: 16,
    color: legacyColors.stone[400],
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
