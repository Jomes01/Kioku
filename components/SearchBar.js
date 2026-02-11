/**
 * SearchBar - Search events by name, type, or date
 */

import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { colors, spacing, typography, fontFamily } from '../styles/theme';

export default function SearchBar({ value, onChangeText, placeholder }) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || 'Search by name, type, or date...'}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: typography.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily,
  },
});
