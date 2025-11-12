import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "@/components/themed-view";
import { Avatar } from "@/components/common/Avatar";
import { Colors } from "@/constants/colors";
import { Spacing, FontSizes } from "@/constants/styles";
import { useConversations } from "@/hooks/useMessage";
import { Conversation } from "@/types/message";
import { router } from "expo-router";
import { SwipeBackView } from "@/components/common";
import { useMe } from "@/hooks/useAuth";

interface ConversationItemProps {
  conversation: Conversation;
  onPress: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  onPress,
}) => {
  const profile = conversation.user.profile;
  const displayName =
    profile?.fullName ||
    conversation.user.email ||
    conversation.user.phone ||
    "Người dùng";
  const avatarUrl = profile?.avatarUrl || null;

  const lastMessage = conversation.lastMessage;
  const lastMessageText =
    lastMessage?.content ||
    (lastMessage?.media && lastMessage.media.length > 0
      ? lastMessage.media[0].mediaType === "video"
        ? "📹 Video"
        : "📷 Hình ảnh"
      : "");

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút`;
    if (diffHours < 24) return `${diffHours} giờ`;
    if (diffDays < 7) return `${diffDays} ngày`;
    return date.toLocaleDateString("vi-VN", { day: "numeric", month: "short" });
  };

  return (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Avatar source={avatarUrl} size={56} showBorder={false} />
      </View>
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={styles.headerRight}>
            {lastMessage && (
              <Text style={styles.conversationTime}>
                {formatTime(lastMessage.createdAt)}
              </Text>
            )}
            {conversation.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.conversationFooter}>
          <Text
            style={[
              styles.lastMessage,
              conversation.unreadCount > 0 && styles.lastMessageUnread,
            ]}
            numberOfLines={1}
          >
            {lastMessageText || "Chưa có tin nhắn"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function ConversationListScreen() {
  const { data: conversations, isLoading, error, refetch } = useConversations();
  const { data: currentUser } = useMe();

  const handleConversationPress = (userId: string) => {
    router.push(`/message/chat/${userId}`);
  };

  const handleSelfMessage = () => {
    if (currentUser?.id) {
      router.push(`/message/chat/${currentUser.id}`);
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <ConversationItem
      conversation={item}
      onPress={() => handleConversationPress(item.userId)}
    />
  );

  if (isLoading) {
    return (
      <SwipeBackView enabled={true} style={styles.container}>
        <ThemedView style={styles.container}>
          <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Tin nhắn</Text>
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
        <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Tin nhắn</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.newMessageButton}
                onPress={() => router.push("/(tabs)/search")}
              >
                <Ionicons name="create-outline" size={24} color={Colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.newMessageButton}
                onPress={handleSelfMessage}
              >
                <Ionicons name="person-outline" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Conversations List */}
          {conversations && conversations.length > 0 ? (
            <FlatList
              data={conversations}
              renderItem={renderConversation}
              keyExtractor={(item) => item.userId}
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
              <Ionicons
                name="chatbubbles-outline"
                size={64}
                color={Colors.textSecondary}
              />
              <Text style={styles.emptyText}>Chưa có tin nhắn</Text>
              <Text style={styles.emptySubtext}>
                Bắt đầu trò chuyện với bạn bè của bạn
              </Text>
              <TouchableOpacity
                style={styles.searchButton}
                onPress={() => router.push("/(tabs)/search")}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: "600",
    color: Colors.text,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  newMessageButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingVertical: Spacing.sm,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  avatarContainer: {
    position: "relative",
    marginRight: Spacing.md,
  },
  unreadBadge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadBadgeText: {
    color: Colors.textLight,
    fontSize: 11,
    fontWeight: "700",
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  conversationName: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.text,
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  conversationTime: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  conversationFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  lastMessageUnread: {
    fontWeight: "600",
    color: Colors.text,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: "center",
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
    fontWeight: "600",
  },
});
