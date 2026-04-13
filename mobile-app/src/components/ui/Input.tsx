import React from 'react';
import { StyleSheet, Text, TextInput, View, type TextStyle, type ViewStyle } from 'react-native';
import { colors } from '@/src/theme';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'decimal-pad';
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  editable?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export default function Input({
  autoCapitalize = 'sentences',
  value,
  onChangeText,
  placeholder,
  label,
  secureTextEntry,
  keyboardType,
  multiline,
  numberOfLines,
  error,
  style,
  inputStyle,
  editable = true,
}: InputProps) {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.stone[400]}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        editable={editable}
        autoCapitalize={autoCapitalize}
        style={[
          styles.input,
          multiline && { height: Math.max(80, (numberOfLines || 3) * 24) },
          error && { borderColor: '#DC2626' },
          !editable && { opacity: 0.6 },
          inputStyle,
        ]}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.stone[600],
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.stone[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.espresso,
    backgroundColor: colors.white,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
});
