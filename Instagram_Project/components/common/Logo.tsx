import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/styles';

export interface LogoProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export const Logo: React.FC<LogoProps> = ({
  size = 80,
  color = Colors.instagram,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name="logo-instagram" size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
});

