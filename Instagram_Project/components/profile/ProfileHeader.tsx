import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/common';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/styles';

export interface ProfileHeaderProps {
  username: string;
  avatar?: string | null;
  posts: number;
  followers: number;
  following: number;
  onAddPress?: () => void;
  onMenuPress?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  username,
  avatar,
  posts,
  followers,
  following,
  onAddPress,
  onMenuPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedText type="title" style={styles.headerTitle}>
            {username}
          </ThemedText>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={onAddPress} style={styles.headerIcon}>
            <Ionicons name="add-circle-outline" size={28} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onMenuPress} style={styles.headerIcon}>
            <Ionicons name="menu-outline" size={28} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Avatar source={avatar} size={90} />
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{String(posts)}</Text>
              <Text style={styles.statLabel}>Bài viết</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{String(followers)}</Text>
              <Text style={styles.statLabel}>Người theo dõi</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{String(following)}</Text>
              <Text style={styles.statLabel}>Đang theo dõi</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  headerIcon: {
    padding: Spacing.xs,
  },
  profileSection: {
    marginTop: Spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    marginRight: Spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});

