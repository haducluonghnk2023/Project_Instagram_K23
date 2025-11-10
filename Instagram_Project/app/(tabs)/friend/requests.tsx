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
import {
  getFriendRequestsApi,
  acceptFriendRequestApi,
  rejectFriendRequestApi,
  cancelFriendRequestApi,
  FriendRequestInfo,
} from '@/services/friend.api';
import { router } from 'expo-router';
import { useMe } from '@/hooks/useAuth';
import { SwipeBackView, useToast } from '@/components/common';
import { getErrorMessage } from '@/utils/error';

interface FriendRequestItemProps {
  request: FriendRequestInfo;
  isIncoming: boolean;
  onAccept?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
  onViewProfile: (userId: string) => void;
  loadingAction?: string | null;
}

const FriendRequestItem: React.FC<FriendRequestItemProps> = ({
  request,
  isIncoming,
  onAccept,
  onReject,
  onCancel,
  onViewProfile,
  loadingAction,
}) => {
  const user = isIncoming ? request.fromUser : request.toUser;
  const profile = user.profile;
  const displayName = profile?.fullName || user.email || user.phone || 'Người dùng';

  return (
    <View style={styles.requestItem}>
      <TouchableOpacity
        style={styles.userContent}
        onPress={() => onViewProfile(user.id)}
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
          {request.message && (
            <Text style={styles.requestMessage} numberOfLines={2}>
              {request.message}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      {isIncoming ? (
        <View style={styles.actionButtons}>
          <Button
            title="Xác nhận"
            onPress={() => onAccept?.(request.id)}
            loading={loadingAction === 'accept'}
            variant="primary"
            fullWidth={false}
            style={styles.confirmButton}
            textStyle={styles.buttonText}
          />
          <Button
            title="Xóa"
            onPress={() => onReject?.(request.id)}
            loading={loadingAction === 'reject'}
            variant="outline"
            fullWidth={false}
            style={styles.rejectButton}
            textStyle={styles.buttonText}
          />
        </View>
      ) : (
        <Button
          title="Hủy"
          onPress={() => onCancel?.(request.id)}
          loading={loadingAction === 'cancel'}
          variant="outline"
          fullWidth={false}
          style={styles.cancelButton}
          textStyle={styles.buttonText}
        />
      )}
    </View>
  );
};

export default function FriendRequestsScreen() {
  const { showToast } = useToast();
  const { data: currentUser, isLoading: isLoadingUser } = useMe();
  const [requests, setRequests] = useState<FriendRequestInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');

  const loadRequests = async () => {
    if (!currentUser?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await getFriendRequestsApi();
      setRequests(data || []);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage || 'Không thể tải lời mời kết bạn.', 'error');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      loadRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const handleAccept = async (requestId: string) => {
    setLoadingAction('accept');
    try {
      await acceptFriendRequestApi({ requestId });
      showToast('Đã chấp nhận lời mời kết bạn', 'success');
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage || 'Không thể chấp nhận lời mời.', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setLoadingAction('reject');
    try {
      await rejectFriendRequestApi(requestId);
      showToast('Đã từ chối lời mời kết bạn', 'success');
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage || 'Không thể từ chối lời mời.', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCancel = async (requestId: string) => {
    setLoadingAction('cancel');
    try {
      await cancelFriendRequestApi(requestId);
      showToast('Đã hủy lời mời kết bạn', 'success');
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage || 'Không thể hủy lời mời.', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleViewProfile = (userId: string) => {
    router.push(`/profile?userId=${userId}`);
  };

  // Separate incoming and outgoing requests
  // Backend trả về status là "pending" (lowercase)
  // Chờ user data load xong trước khi filter
  const incomingRequests = currentUser?.id
    ? requests.filter(
        (r) => r.status?.toLowerCase() === 'pending' && r.toUserId === currentUser.id
      )
    : [];
  const outgoingRequests = currentUser?.id
    ? requests.filter(
        (r) => r.status?.toLowerCase() === 'pending' && r.fromUserId === currentUser.id
      )
    : [];

  const renderRequest = ({ item }: { item: FriendRequestInfo }) => {
    const isIncoming = item.toUserId === currentUser?.id;
    return (
      <FriendRequestItem
        request={item}
        isIncoming={isIncoming}
        onAccept={isIncoming ? handleAccept : undefined}
        onReject={isIncoming ? handleReject : undefined}
        onCancel={!isIncoming ? handleCancel : undefined}
        onViewProfile={handleViewProfile}
        loadingAction={loadingAction}
      />
    );
  };

  const allRequests = [...incomingRequests, ...outgoingRequests];

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
              <Text style={styles.headerTitle}>Lời mời kết bạn</Text>
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
            <Text style={styles.headerTitle}>Lời mời kết bạn</Text>
            <View style={styles.backButton} />
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'incoming' && styles.tabActive]}
              onPress={() => setActiveTab('incoming')}
            >
              <Text style={activeTab === 'incoming' ? styles.tabTextActive : styles.tabText}>
                Đã nhận ({incomingRequests.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'outgoing' && styles.tabActive]} 
              onPress={() => setActiveTab('outgoing')}
            >
              <Text style={activeTab === 'outgoing' ? styles.tabTextActive : styles.tabText}>
                Đã gửi ({outgoingRequests.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Requests List */}
          {(() => {
            const displayRequests = activeTab === 'incoming' ? incomingRequests : outgoingRequests;
            return displayRequests.length > 0 ? (
              <FlatList
                data={displayRequests}
                renderItem={renderRequest}
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
                <Ionicons name="person-add-outline" size={64} color={Colors.textSecondary} />
                <Text style={styles.emptyText}>Không có lời mời kết bạn</Text>
                <Text style={styles.emptySubtext}>
                  Tất cả lời mời kết bạn đã được xử lý
                </Text>
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={() => router.push('/(tabs)/search')}
                >
                  <Text style={styles.searchButtonText}>Tìm kiếm bạn bè</Text>
                </TouchableOpacity>
              </View>
            );
          })()}
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
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.text,
  },
  tabText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: Spacing.sm,
  },
  requestItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
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
    marginBottom: 4,
  },
  requestMessage: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
  },
  rejectButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
  },
  cancelButton: {
    width: '100%',
    paddingVertical: Spacing.sm,
  },
  buttonText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
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
