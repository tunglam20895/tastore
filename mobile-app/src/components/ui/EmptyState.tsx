import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/src/theme';
import Button from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon || <Text style={styles.defaultIcon}>📦</Text>}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} style={styles.button} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  defaultIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.stone[400],
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: colors.stone[400],
    textAlign: 'center',
    marginTop: 8,
  },
  button: {
    marginTop: 20,
  },
});
