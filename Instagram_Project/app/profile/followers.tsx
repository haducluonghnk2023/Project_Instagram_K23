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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { Avatar } from '@/components/common/Avatar';
import { Colors } from '@/constants/colors';
import { Spacing, FontSizes } from '@/constants/styles';
import { getFriendsApi, getUserFriendsApi, FriendInfo } from '@/services/friend.api';
import { router, useLocalSearchParams } from 'expo-router';
import { useToast } from '@/components/common/ToastProvider';
import { SwipeBackView } from '@/components/common';
import { getErrorMessage } from '@/utils/error';
import { useUser } from '@/hooks/useAuth';

interface FollowerItemProps {
  friend: FriendInfo;
  onViewProfile: (userId: string) => void;
}

const FollowerItem: React.FC<FollowerItemProps> = ({
  friend,
  onViewProfile,
}) => {
  const profile = friend.user.profile;
  const displayName = profile?.fullName || friend.user.email || friend.user.phone || 'Người dùng';

  return (
    <TouchableOpacity
      style={styles.followerItem}
      onPress={() => onViewProfile(friend.userId)}
      activeOpacity={0.7}
    >
      <Avatar
        source={profile?.avatarUrl || null}
        size={56}
        style={styles.avatar}
      />
      <View style={styles.followerInfo}>
        <Text style={styles.followerName} numberOfLines={1}>
          {displayName}
        </Text>
        {profile?.bio && (
          <Text style={styles.followerBio} numberOfLines={1}>
            {profile.bio}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );
};

export default function FollowersScreen() {
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const { data: userInfo } = useUser(userId || '', { enabled: !!userId });
  const [followers, setFollowers] = useState<FriendInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();

  // Lấy tên user để hiển thị trong header
  const displayName = userInfo?.profile?.fullName || userInfo?.email || 'Người dùng';
  const headerTitle = userId ? `Người theo dõi của ${displayName}` : 'Người theo dõi';

  const loadFollowers = async () => {
    try {
      // Nếu có userId thì load followers của user đó, nếu không thì load của chính mình
      const data = userId 
        ? await getUserFriendsApi(userId)
        : await getFriendsApi();
      setFollowers(data || []);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage || 'Không thể tải danh sách người theo dõi.', 'error');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFollowers();
  }, [userId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadFollowers();
  };

  const handleViewProfile = (userId: string) => {
    router.push(`/profile?userId=${userId}`);
  };

  const renderFollower = ({ item }: { item: FriendInfo }) => (
    <FollowerItem
      friend={item}
      onViewProfile={handleViewProfile}
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
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace('/(tabs)/home');
                  }
                }}
              >
                <Ionicons name="arrow-back" size={24} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{headerTitle}</Text>
              <View style={styles.placeholder} />
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
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)/home');
                }
              }}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Người theo dõi</Text>
            <View style={styles.placeholder} />
          </View>
          
          {/* Followers List */}
          {followers.length > 0 ? (
            <FlatList
              data={followers}
              renderItem={renderFollower}
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
              <Text style={styles.emptyText}>Chưa có người theo dõi</Text>
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
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: Spacing.sm,
  },
  followerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  avatar: {
    marginRight: Spacing.md,
  },
  followerInfo: {
    flex: 1,
  },
  followerName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  followerBio: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
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
  },
});

