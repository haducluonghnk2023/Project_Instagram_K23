import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { Avatar } from '@/components/common/Avatar';
import { Colors } from '@/constants/colors';
import { Spacing, FontSizes } from '@/constants/styles';
import { unblockUserApi, FriendInfo } from '@/services/friend.api';
import { useBlockedUsers } from '@/hooks/useFriend';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { SwipeBackView, useToast, ConfirmDialog } from '@/components/common';
import { getErrorMessage } from '@/utils/error';

interface BlockedUserItemProps {
  blockedUser: FriendInfo;
  onUnblock: (userId: string, userName: string) => void;
  onViewProfile: (userId: string) => void;
  isUnblocking: boolean;
}

const BlockedUserItem: React.FC<BlockedUserItemProps> = ({
  blockedUser,
  onUnblock,
  onViewProfile,
  isUnblocking,
}) => {
  const profile = blockedUser.user.profile;
  const displayName = profile?.fullName || blockedUser.user.email || blockedUser.user.phone || 'Người dùng';
  const [showConfirm, setShowConfirm] = useState(false);

  const handleUnblock = () => {
    setShowConfirm(true);
  };

  return (
    <View style={styles.blockedItem}>
      <TouchableOpacity
        style={styles.userContent}
        onPress={() => onViewProfile(blockedUser.userId)}
        activeOpacity={0.7}
      >
        <Avatar
          source={profile?.avatarUrl || null}
          size={56}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {displayName}
          </Text>
          {profile?.bio && (
            <Text style={styles.userBio} numberOfLines={1}>
              {profile.bio}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.unblockButton, isUnblocking && styles.unblockButtonDisabled]}
        onPress={handleUnblock}
        disabled={isUnblocking}
      >
        {isUnblocking ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <Text style={styles.unblockButtonText}>Gỡ chặn</Text>
        )}
      </TouchableOpacity>
      <ConfirmDialog
        visible={showConfirm}
        title="Gỡ chặn"
        message={`Bạn có chắc chắn muốn gỡ chặn ${displayName}?`}
        confirmText="Gỡ chặn"
        cancelText="Hủy"
        type="info"
        onConfirm={() => {
          setShowConfirm(false);
          onUnblock(blockedUser.userId, displayName);
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </View>
  );
};

export default function BlockedUsersScreen() {
  const { showToast } = useToast();
  const { data: blockedUsers, isLoading, refetch } = useBlockedUsers();
  const [unblockingUserId, setUnblockingUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleUnblock = async (userId: string, userName: string) => {
    setUnblockingUserId(userId);
    try {
      await unblockUserApi(userId);
      showToast(`Đã gỡ chặn ${userName}`, 'success');
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['blockedUsers'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage || 'Không thể gỡ chặn người dùng.', 'error');
    } finally {
      setUnblockingUserId(null);
    }
  };

  const handleViewProfile = (userId: string) => {
    router.push(`/profile?userId=${userId}`);
  };

  const renderBlockedUser = ({ item }: { item: FriendInfo }) => (
    <BlockedUserItem
      blockedUser={item}
      onUnblock={handleUnblock}
      onViewProfile={handleViewProfile}
      isUnblocking={unblockingUserId === item.userId}
    />
  );

  if (isLoading) {
    return (
      <SwipeBackView enabled={true} style={styles.container}>
        <ThemedView style={styles.container}>
          <SafeAreaView edges={['top']} style={styles.safeArea}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Người bị chặn</Text>
              <View style={styles.backButton} />
            </View>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          </SafeAreaView>
        </ThemedView>
      </SwipeBackView>
    );
  }

  return (
    <SwipeBackView enabled={true} style={styles.container}>
      <ThemedView style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Người bị chặn</Text>
            <View style={styles.backButton} />
          </View>

        {/* Blocked Users List */}
        {blockedUsers && blockedUsers.length > 0 ? (
          <FlatList
            data={blockedUsers}
            renderItem={renderBlockedUser}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.primary}
              />
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="ban-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>Chưa có người bị chặn</Text>
            <Text style={styles.emptySubtext}>
              Danh sách người bạn đã chặn sẽ hiển thị ở đây
            </Text>
          </View>
        )}
      </SafeAreaView>
      </ThemedView>
    </SwipeBackView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    height: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  backButton: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: Spacing.sm,
  },
  blockedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: Spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  userBio: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  unblockButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.background,
  },
  unblockButtonDisabled: {
    opacity: 0.5,
  },
  unblockButtonText: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

