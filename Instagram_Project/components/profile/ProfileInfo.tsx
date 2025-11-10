import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/styles';

export interface ProfileInfoProps {
  fullName: string;
  bio?: string;
  website?: string;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({
  fullName,
  bio,
  website,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.fullName}>{fullName}</Text>
      {bio && <Text style={styles.bio}>{bio}</Text>}
      {website && <Text style={styles.website}>{website}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  fullName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  bio: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  website: {
    fontSize: 14,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
});

