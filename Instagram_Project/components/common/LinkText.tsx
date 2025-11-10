import React from 'react';
import { Text, TouchableOpacity, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { Link } from 'expo-router';
import { Colors } from '@/constants/colors';

export interface LinkTextProps {
  text: string;
  linkText: string;
  href: string;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
  linkStyle?: TextStyle;
}

export const LinkText: React.FC<LinkTextProps> = ({
  text,
  linkText,
  href,
  containerStyle,
  textStyle,
  linkStyle,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.text, textStyle]}>{text}</Text>
      <Link href={href} asChild>
        <TouchableOpacity>
          <Text style={[styles.link, linkStyle]}>{linkText}</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
};

import { View } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  text: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  link: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

