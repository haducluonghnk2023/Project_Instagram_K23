import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/styles';

export interface DividerProps {
  text?: string;
  style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({ text, style }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.line} />
      {text && (
        <>
          <Text style={styles.text}>{text}</Text>
          <View style={styles.line} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  text: {
    marginHorizontal: Spacing.md,
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});

