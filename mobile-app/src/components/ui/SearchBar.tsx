import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, shadows, borderRadius } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onFilterPress?: () => void;
  showFilter?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Tìm kiếm...',
  value,
  onChangeText,
  onFilterPress,
  showFilter = true,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <MaterialIcons
          name="search"
          size={20}
          color={colors.outline}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors['outline-variant']}
          value={value}
          onChangeText={onChangeText}
        />
        {showFilter && (
          <TouchableOpacity
            onPress={onFilterPress}
            style={styles.filterButton}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="tune"
              size={20}
              color={colors.outline}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors['surface-container-lowest'],
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    ...shadows.card,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  input: {
    flex: 1,
    fontFamily: typography.fontFamily['body-md'],
    fontSize: typography.fontSize['body-md'],
    color: colors['on-surface'],
    paddingVertical: 0,
  },
  filterButton: {
    marginLeft: spacing.xs,
    padding: 4,
  },
});
