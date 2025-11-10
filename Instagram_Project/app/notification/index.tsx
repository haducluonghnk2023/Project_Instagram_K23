import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { Avatar } from '@/components/common/Avatar';
import { Colors } from '@/constants/colors';
import { Spacing, FontSizes } from '@/constants/styles';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
} from '@/hooks/useNotification';
import { Notification } from '@/types/notification';
import { router } from 'expo-router';
import { SwipeBackView } from '@/components/common';

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
  onLongPress: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onLongPress,
}) => {
  const actor = notification.actor;
  const displayName = actor?.profile?.fullName || actor?.email || actor?.phone || 'Người dùng';
  const avatarUrl = actor?.profile?.avatarUrl || null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message_new':
        return 'chatbubble-outline';
      case 'friend_request':
        return 'person-add-outline';
      case 'friend_accept':
        return 'checkmark-circle-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationText = (type: string) => {
    switch (type) {
      case 'message_new':
        return 'đã gửi cho bạn một tin nhắn';
      case 'friend_request':
        return 'đã gửi lời mời kết bạn';
      case 'friend_accept':
        return 'đã chấp nhận lời mời kết bạn';
      default:
        return 'có thông báo mới';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
  };

  return (
    <TouchableOpacity
      style={[styles.notificationItem, !notification.isRead && styles.notificationItemUnread]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={getNotificationIcon(notification.type)}
            size={24}
            color={notification.isRead ? Colors.textSecondary : Colors.primary}
          />
        </View>
        <Avatar source={avatarUrl} size={48} showBorder={false} style={styles.avatar} />
        <View style={styles.notificationTextContainer}>
          <Text style={styles.notificationText} numberOfLines={2}>
            <Text style={styles.notificationName}>{displayName}</Text>{' '}
            {getNotificationText(notification.type)}
          </Text>
          <Text style={styles.notificationTime}>{formatTime(notification.createdAt)}</Text>
        </View>
      </View>
      {!notification.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

export default function NotificationScreen() {
  const { data: notifications, isLoading, refetch } = useNotifications();
  const { mutate: markAsRead } = useMarkNotificationAsRead();
  const { mutate: markAllAsRead } = useMarkAllNotificationsAsRead();
  const { mutate: deleteNotification } = useDeleteNotification();

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Navigate based on type
    if (notification.type === 'message_new' && notification.actorId) {
      router.push(`/message/chat/${notification.actorId}`);
    } else if (notification.type === 'friend_request') {
      router.push('/(tabs)/friend/requests');
    } else if (notification.type === 'friend_accept' && notification.actorId) {
      router.push(`/profile?userId=${notification.actorId}`);
    }
  };

  const handleNotificationLongPress = (notification: Notification) => {
    Alert.alert(
      'Thông báo',
      'Bạn muốn làm gì?',
      [
        {
          text: notification.isRead ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc',
          onPress: () => {
            if (notification.isRead) {
              // Note: Backend doesn't support unmark, so we'll just refresh
              refetch();
            } else {
              markAsRead(notification.id);
            }
          },
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa thông báo này?', [
              { text: 'Hủy', style: 'cancel' },
              {
                text: 'Xóa',
                style: 'destructive',
                onPress: () => deleteNotification(notification.id),
              },
            ]);
          },
        },
        { text: 'Hủy', style: 'cancel' },
      ]
    );
  };

  const handleMarkAllAsRead = () => {
    Alert.alert('Xác nhận', 'Đánh dấu tất cả thông báo là đã đọc?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đánh dấu',
        onPress: () => markAllAsRead(),
      },
    ]);
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <NotificationItem
      notification={item}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => handleNotificationLongPress(item)}
    />
  );

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  if (isLoading) {
    return (
      <SwipeBackView enabled={true} style={styles.container}>
        <ThemedView style={styles.container}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
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
            <Text style={styles.headerTitle}>Thông báo</Text>
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
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thông báo</Text>
          {unreadCount > 0 ? (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
            >
              <Text style={styles.markAllButtonText}>Đánh dấu tất cả</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backButton} />
          )}
        </View>

        {/* Notifications List */}
        {notifications && notifications.length > 0 ? (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refetch}
                tintColor={Colors.primary}
              />
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>Chưa có thông báo</Text>
            <Text style={styles.emptySubtext}>
              Các thông báo mới sẽ xuất hiện ở đây
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  backButton: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.text,
  },
  markAllButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  markAllButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
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
  notificationItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationItemUnread: {
    backgroundColor: Colors.primaryLight + '20',
  },
  notificationContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  avatar: {
    marginRight: Spacing.md,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  notificationName: {
    fontWeight: '600',
  },
  notificationTime: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
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
  },
});
