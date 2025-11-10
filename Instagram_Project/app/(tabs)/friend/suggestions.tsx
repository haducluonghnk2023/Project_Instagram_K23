import React, { useEffect, useState } from 'react';
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
import { Button } from '@/components/common/Button';
import { Colors } from '@/constants/colors';
import { Spacing, FontSizes } from '@/constants/styles';
import { searchUsersApi, sendFriendRequestApi, getFriendsApi, getFriendRequestsApi, cancelFriendRequestApi } from '@/services/friend.api';
import { UserInfo } from '@/types/auth';
import { router } from 'expo-router';
import { useMe } from '@/hooks/useAuth';
import { SwipeBackView, useToast } from '@/components/common';
import { getErrorMessage } from '@/utils/error';
import { logger } from '@/utils/logger';

interface SuggestionItemProps {
  user: UserInfo;
  onSendRequest: (user: UserInfo) => void;
  onCancelRequest: (user: UserInfo) => void;
  isLoading?: boolean;
  hasSentRequest?: boolean;
}

const SuggestionItem: React.FC<SuggestionItemProps> = ({
  user,
  onSendRequest,
  onCancelRequest,
  isLoading = false,
  hasSentRequest = false,
}) => {
  const profile = user.profile;
  const displayName = profile?.fullName || user.email || user.phone || 'Người dùng';

  return (
    <View style={styles.suggestionItem}>
      <TouchableOpacity
        style={styles.userContent}
        onPress={() => router.push(`/profile?userId=${user.id}`)}
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
      {hasSentRequest ? (
        <Button
          title="Hủy"
          onPress={() => onCancelRequest(user)}
          loading={isLoading}
          variant="outline"
          fullWidth={false}
          style={styles.cancelButton}
          textStyle={styles.cancelButtonText}
        />
      ) : (
        <Button
          title="Thêm bạn"
          onPress={() => onSendRequest(user)}
          loading={isLoading}
          variant="primary"
          fullWidth={false}
          style={styles.addButton}
          textStyle={styles.addButtonText}
        />
      )}
    </View>
  );
};

export default function SuggestionsScreen() {
  const { data: currentUser, isLoading: isLoadingUser } = useMe();
  const { showToast } = useToast();
  const [suggestions, setSuggestions] = useState<UserInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingUserIds, setLoadingUserIds] = useState<Set<string>>(new Set());
  const [sentRequestUserIds, setSentRequestUserIds] = useState<Set<string>>(new Set());
  const [requestIds, setRequestIds] = useState<Map<string, string>>(new Map()); // userId -> requestId

  const loadSuggestions = async () => {
    if (!currentUser?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Lấy tất cả users, friends, và friend requests
      const [usersResponse, friendsResponse, requestsResponse] = await Promise.all([
        searchUsersApi(''),
        getFriendsApi().catch((error) => {
          logger.error('Error loading friends:', error);
          return [];
        }),
        getFriendRequestsApi().catch((error) => {
          logger.error('Error loading friend requests:', error);
          return [];
        }),
      ]);

      const allUsers = usersResponse.users || [];
      const friends = friendsResponse || [];
      const requests = requestsResponse || [];

      // Lấy danh sách user IDs cần loại bỏ:
      // 1. User hiện tại
      // 2. Đã là bạn bè
      // 3. Đã gửi/nhận lời mời kết bạn
      const excludeUserIds = new Set<string>();
      excludeUserIds.add(currentUser.id);

      // Thêm bạn bè vào danh sách loại bỏ
      friends.forEach((friend) => {
        excludeUserIds.add(friend.userId);
      });

      // Lưu danh sách user đã gửi request (để hiển thị nút "Hủy")
      const newSentUserIds = new Set<string>();
      const newRequestIds = new Map<string, string>();
      
      // Thêm những người đã có lời mời kết bạn (gửi hoặc nhận)
      requests.forEach((request) => {
        if (request.fromUserId === currentUser.id && request.status === 'pending') {
          // Đã gửi request - không loại bỏ khỏi suggestions, chỉ đánh dấu
          newSentUserIds.add(request.toUserId);
          newRequestIds.set(request.toUserId, request.id);
        } else if (request.toUserId === currentUser.id) {
          // Đã nhận request - loại bỏ khỏi suggestions
          excludeUserIds.add(request.fromUserId);
        }
      });

      // Lọc bỏ những user không nên hiển thị (nhưng giữ lại những user đã gửi request)
      const filteredSuggestions = allUsers.filter(
        (user) => !excludeUserIds.has(user.id)
      );

      setSuggestions(filteredSuggestions);
      setSentRequestUserIds(newSentUserIds);
      setRequestIds(newRequestIds);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage || 'Không thể tải gợi ý.', 'error');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      loadSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadSuggestions();
  };

  const handleSendRequest = async (user: UserInfo) => {
    if (!user.phone) {
      showToast('Không thể gửi lời mời: Người dùng không có số điện thoại', 'error');
      return;
    }

    setLoadingUserIds((prev) => new Set(prev).add(user.id));
    try {
      const response = await sendFriendRequestApi({ phone: user.phone });
      // Update state để hiển thị nút "Hủy"
      setSentRequestUserIds((prev) => new Set(prev).add(user.id));
      setRequestIds((prev) => {
        const newMap = new Map(prev);
        newMap.set(user.id, response.id);
        return newMap;
      });
      // Không hiển thị thông báo thành công và không xóa user khỏi danh sách
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage || 'Không thể gửi lời mời. Vui lòng thử lại.', 'error');
    } finally {
      setLoadingUserIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });
    }
  };

  const handleCancelRequest = async (user: UserInfo) => {
    const requestId = requestIds.get(user.id);
    if (!requestId) {
      return;
    }

    setLoadingUserIds((prev) => new Set(prev).add(user.id));
    try {
      await cancelFriendRequestApi(requestId);
      // Update state để hiển thị lại nút "Thêm bạn"
      setSentRequestUserIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });
      setRequestIds((prev) => {
        const newMap = new Map(prev);
        newMap.delete(user.id);
        return newMap;
      });
      // Không hiển thị thông báo
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage || 'Không thể hủy lời mời. Vui lòng thử lại.', 'error');
    } finally {
      setLoadingUserIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });
    }
  };

  const renderSuggestion = ({ item }: { item: UserInfo }) => (
    <SuggestionItem
      user={item}
      onSendRequest={handleSendRequest}
      onCancelRequest={handleCancelRequest}
      isLoading={loadingUserIds.has(item.id)}
      hasSentRequest={sentRequestUserIds.has(item.id)}
    />
  );

  if (isLoading || isLoadingUser || !currentUser?.id) {
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
            <Text style={styles.headerTitle}>Gợi ý kết bạn</Text>
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
          <Text style={styles.headerTitle}>Gợi ý kết bạn</Text>
          <View style={styles.backButton} />
        </View>

        {/* Suggestions List */}
        {suggestions.length > 0 ? (
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
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
            <Text style={styles.emptyText}>Không có gợi ý</Text>
            <Text style={styles.emptySubtext}>
              Tất cả gợi ý đã được hiển thị
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
    flex: 1,
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: Spacing.sm,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.md,
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
  addButton: {
    minWidth: 100,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  addButtonText: {
    fontSize: FontSizes.sm,
  },
  cancelButton: {
    minWidth: 100,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  cancelButtonText: {
    fontSize: FontSizes.sm,
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
});

