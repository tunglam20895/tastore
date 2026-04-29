import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, shadows, borderRadius } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: string;
  trend?: string;
  trendUp?: boolean;
  badge?: string;
  variant?: 'default' | 'large' | 'accent';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendUp,
  badge,
  variant = 'default',
}) => {
  const isLarge = variant === 'large';
  const isAccent = variant === 'accent';

  return (
    <View
      style={[
        styles.container,
        isLarge && styles.containerLarge,
        isAccent && styles.containerAccent,
      ]}
    >
      {/* Header with icon and badge */}
      <View style={styles.header}>
        {icon && (
          <View
            style={[
              styles.iconContainer,
              isAccent && styles.iconContainerAccent,
            ]}
          >
            <MaterialIcons
              name={icon as any}
              size={isLarge ? 32 : 20}
              color={isAccent ? colors['on-secondary-container'] : colors.secondary}
            />
          </View>
        )}
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Value */}
      <Text style={[styles.value, isLarge && styles.valueLarge]}>{value}</Text>

      {/* Trend */}
      {trend && (
        <View style={styles.trendContainer}>
          <MaterialIcons
            name={trendUp ? 'trending-up' : 'trending-down'}
            size={12}
            color={trendUp ? '#16A34A' : '#DC2626'}
          />
          <Text style={[styles.trendText, trendUp ? styles.trendUp : styles.trendDown]}>
            {trend}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors['surface-container-lowest'],
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors['outline-variant'],
    ...shadows.card,
  },
  containerLarge: {
    padding: spacing.md,
  },
  containerAccent: {
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors['secondary-container'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerAccent: {
    backgroundColor: colors['secondary-container'],
  },
  badge: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontFamily: typography.fontFamily['label-sm'],
    fontSize: 10,
    fontWeight: '600',
    color: '#16A34A',
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: typography.fontFamily['label-sm'],
    fontSize: typography.fontSize['label-sm'],
    fontWeight: '600',
    color: colors['on-surface-variant'],
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing['label-sm'],
    marginBottom: spacing.xs,
  },
  value: {
    fontFamily: typography.fontFamily.h2,
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.h2,
    color: colors.primary,
    lineHeight: typography.lineHeight.h2,
  },
  valueLarge: {
    fontSize: 28,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  trendText: {
    fontFamily: typography.fontFamily['body-md'],
    fontSize: 12,
    fontWeight: '500',
  },
  trendUp: {
    color: '#16A34A',
  },
  trendDown: {
    color: '#DC2626',
  },
});
