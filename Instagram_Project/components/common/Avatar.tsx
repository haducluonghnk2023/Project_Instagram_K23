import React from 'react';
import { View, Image, StyleSheet, ImageSourcePropType, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export interface AvatarProps {
  source?: ImageSourcePropType | string | null;
  size?: number;
  style?: ViewStyle;
  showBorder?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  size = 90,
  style,
  showBorder = true,
}) => {
  const avatarStyle = [
    {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
    showBorder && {
      borderWidth: 2,
      borderColor: Colors.border,
    },
    style,
  ];

  if (source && typeof source !== 'string') {
    return <Image source={source} style={avatarStyle} />;
  }

  if (source && typeof source === 'string') {
    return <Image source={{ uri: source }} style={avatarStyle} />;
  }

  return (
    <View style={[avatarStyle, styles.placeholder]}>
      <Ionicons name="person" size={size * 0.45} color={Colors.textSecondary} />
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

