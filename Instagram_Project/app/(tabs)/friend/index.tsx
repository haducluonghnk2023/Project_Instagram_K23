import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { ConfirmDialog } from '@/components/common';
import { useToast } from '@/components/common/ToastProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { Avatar } from '@/components/common/Avatar';
import { Colors } from '@/constants/colors';
import { Spacing, FontSizes } from '@/constants/styles';
import { getFriendsApi, blockUserApi } from '@/services/friend.api';
import { FriendInfo } from '@/services/friend.api';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { SwipeBackView } from '@/components/common';
import { getErrorMessage } from '@/utils/error';

interface FriendItemProps {
  friend: FriendInfo;
  onBlock: (userId: string, userName: string) => void;
  onViewProfile: (userId: string) => void;
}

const FriendItem: React.FC<FriendItemProps> = ({
  friend,
  onBlock,
  onViewProfile,
}) => {
  const profile = friend.user.profile;
  const displayName = profile?.fullName || friend.user.email || friend.user.phone || 'Người dùng';
  const [showMenu, setShowMenu] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  const handleMenuPress = () => {
    setShowMenu(!showMenu);
  };

  const handleBlock = () => {
    setShowMenu(false);
    setShowBlockConfirm(true);
  };

  return (
    <View style={styles.friendItem}>
      <View style={styles.friendContent}>
        <TouchableOpacity
          onPress={() => onViewProfile(friend.userId)}
          activeOpacity={0.7}
          style={styles.friendInfoTouchable}
        >
          <Avatar
            source={profile?.avatarUrl || null}
            size={56}
            style={styles.avatar}
          />
          <View style={styles.friendInfo}>
            <Text style={styles.friendName} numberOfLines={1}>
              {displayName}
            </Text>
            {profile?.bio && (
              <Text style={styles.friendBio} numberOfLines={1}>
                {profile.bio}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={handleMenuPress}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>
      {showMenu && (
        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleBlock}
          >
            <Ionicons name="ban-outline" size={20} color={Colors.error} />
            <Text style={[styles.menuItemText, { color: Colors.error }]}>Chặn</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowMenu(false)}
          >
            <Text style={styles.menuItemText}>Hủy</Text>
          </TouchableOpacity>
        </View>
      )}

      <ConfirmDialog
        visible={showBlockConfirm}
        title="Chặn người dùng"
        message={`Bạn có chắc chắn muốn chặn ${displayName}?`}
        confirmText="Chặn"
        cancelText="Hủy"
        type="danger"
        onConfirm={() => {
          setShowBlockConfirm(false);
          onBlock(friend.userId, displayName);
        }}
        onCancel={() => setShowBlockConfirm(false)}
      />
    </View>
  );
};

export default function FriendListScreen() {
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const loadFriends = async () => {
    try {
      const data = await getFriendsApi();
      setFriends(data || []);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage || 'Không thể tải danh sách bạn bè.', "error");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFriends();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadFriends();
  };


  const handleBlock = async (userId: string, userName: string) => {
    try {
      await blockUserApi({ userId });
      showToast(`Đã chặn ${userName}`, "success");
      // Remove from local state
      setFriends((prev) => prev.filter((f) => f.userId !== userId));
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage || 'Không thể chặn người dùng.', "error");
    }
  };

  const handleViewProfile = (userId: string) => {
    router.push(`/profile?userId=${userId}`);
  };

  const renderFriend = ({ item }: { item: FriendInfo }) => (
    <FriendItem
      friend={item}
      onBlock={handleBlock}
      onViewProfile={handleViewProfile}
    />
  );

  if (isLoading) {
    return (
      <SwipeBackView enabled={true} style={styles.container}>
      <ThemedView style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Bạn bè</Text>
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
          <Text style={styles.headerTitle}>Bạn bè</Text>
          <TouchableOpacity
            style={styles.requestsButton}
            onPress={() => router.push('/(tabs)/friend/requests')}
          >
            <Ionicons name="person-add-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/friend/suggestions')}
          >
            <Ionicons name="people-outline" size={20} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Gợi ý kết bạn</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/friend/blocked')}
          >
            <Ionicons name="ban-outline" size={20} color={Colors.error} />
            <Text style={[styles.actionButtonText, { color: Colors.error }]}>Người bị chặn</Text>
          </TouchableOpacity>
        </View>

        {/* Friends List */}
        {friends.length > 0 ? (
          <FlatList
            data={friends}
            renderItem={renderFriend}
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
            <Ionicons name="people-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>Chưa có bạn bè</Text>
            <Text style={styles.emptySubtext}>
              Tìm kiếm bạn bè để kết bạn
            </Text>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => router.push('/(tabs)/search')}
            >
              <Text style={styles.searchButtonText}>Tìm kiếm bạn bè</Text>
            </TouchableOpacity>
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
  requestsButton: {
    padding: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: Spacing.sm,
  },
  friendItem: {
    position: 'relative',
    backgroundColor: Colors.background,
  },
  friendContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    justifyContent: 'space-between',
  },
  friendInfoTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: Spacing.md,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  friendBio: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  menuButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  menu: {
    position: 'absolute',
    right: Spacing.md,
    top: 50,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
    minWidth: 150,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    marginLeft: Spacing.sm,
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
    marginBottom: Spacing.lg,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    marginTop: Spacing.md,
  },
  searchButtonText: {
    color: Colors.textLight,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  actionButtonText: {
    color: Colors.primary,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
});
