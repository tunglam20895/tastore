import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme';

interface AdminDetailHeaderProps {
  title: string;
  onBack?: () => void;
  showNotification?: boolean;
  showAI?: boolean;
  rightAction?: { icon: string; onPress: () => void };
}

export default function AdminDetailHeader({
  title,
  onBack,
  showNotification = false,
  showAI = false,
  rightAction,
}: AdminDetailHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {/* Left: Back + Title */}
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={colors.espresso} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        </View>

        {/* Right: AI + Bell + Custom Action */}
        <View style={styles.rightSection}>
          {showAI && (
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(admin)/ai-chat' as any)} activeOpacity={0.7}>
              <Ionicons name="sparkles" size={20} color={colors.blush} />
            </TouchableOpacity>
          )}
          {showNotification && (
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(admin)/don-hang' as any)} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={20} color={colors.espresso} />
            </TouchableOpacity>
          )}
          {rightAction && (
            <TouchableOpacity style={styles.iconBtn} onPress={rightAction.onPress} activeOpacity={0.7}>
              <Ionicons name={rightAction.icon as any} size={20} color={colors.espresso} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.stone[200]}60`,
    minHeight: 44,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${colors.blush}12`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.espresso,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: `${colors.blush}12`,
  },
});
