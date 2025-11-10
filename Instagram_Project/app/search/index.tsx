import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "@/components/themed-view";
import { Input } from "@/components/common/Input";
import { Avatar } from "@/components/common/Avatar";
import { Button } from "@/components/common/Button";
import { Colors } from "@/constants/colors";
import { Spacing, FontSizes } from "@/constants/styles";
import { searchUsersApi, sendFriendRequestApi } from "@/services/friend.api";
import { UserInfo } from "@/types/auth";
import { SwipeBackView } from "@/components/common";

interface SearchResultItemProps {
  user: UserInfo;
  onSendRequest: (user: UserInfo) => void;
  isLoading?: boolean;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({
  user,
  onSendRequest,
  isLoading = false,
}) => {
  const profile = user.profile;
  const displayName =
    profile?.fullName || user.email || user.phone || "Người dùng";

  return (
    <View style={styles.searchItem}>
      <Avatar
        source={profile?.avatarUrl || null}
        size={56}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>
          {displayName}
        </Text>
        {profile?.fullName && (
          <Text style={styles.userEmail} numberOfLines={1}>
            {user.email || user.phone}
          </Text>
        )}
      </View>
      <Button
        title="Thêm bạn"
        onPress={() => onSendRequest(user)}
        loading={isLoading}
        variant="primary"
        fullWidth={false}
        style={styles.addButton}
        textStyle={styles.addButtonText}
      />
    </View>
  );
};

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingUserIds, setLoadingUserIds] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await searchUsersApi(searchQuery.trim());
      setSearchResults(response.users || []);
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message ||
          error?.message ||
          "Không thể tìm kiếm. Vui lòng thử lại."
      );
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (user: UserInfo) => {
    if (!user.phone) {
      Alert.alert(
        "Lỗi",
        "Không thể gửi lời mời: Người dùng không có số điện thoại"
      );
      return;
    }

    setLoadingUserIds((prev) => new Set(prev).add(user.id));
    try {
      await sendFriendRequestApi({ phone: user.phone });
      Alert.alert("Thành công", "Đã gửi lời mời kết bạn");
      // Remove from search results after sending request
      setSearchResults((prev) => prev.filter((u) => u.id !== user.id));
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message ||
          error?.message ||
          "Không thể gửi lời mời. Vui lòng thử lại."
      );
    } finally {
      setLoadingUserIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });
    }
  };

  const renderSearchResult = ({ item }: { item: UserInfo }) => (
    <SearchResultItem
      user={item}
      onSendRequest={handleSendRequest}
      isLoading={loadingUserIds.has(item.id)}
    />
  );

  return (
    <SwipeBackView enabled={true} style={styles.container}>
      <ThemedView style={styles.container}>
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Tìm kiếm</Text>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Input
              placeholder="Tìm kiếm theo email hoặc số điện thoại..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              leftIcon="search-outline"
              containerStyle={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Results */}
          {isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
            </View>
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : searchQuery.length > 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="search-outline"
                size={64}
                color={Colors.textSecondary}
              />
              <Text style={styles.emptyText}>Không tìm thấy kết quả</Text>
              <Text style={styles.emptySubtext}>
                Thử tìm kiếm với email hoặc số điện thoại khác
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="people-outline"
                size={64}
                color={Colors.textSecondary}
              />
              <Text style={styles.emptyText}>Tìm kiếm bạn bè</Text>
              <Text style={styles.emptySubtext}>
                Nhập email hoặc số điện thoại để tìm bạn bè
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
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    color: Colors.text,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    position: "relative",
  },
  searchInput: {
    marginBottom: 0,
  },
  clearButton: {
    position: "absolute",
    right: Spacing.md + 8,
    top: Spacing.sm + 12,
    zIndex: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  listContent: {
    paddingVertical: Spacing.sm,
  },
  searchItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  avatar: {
    marginRight: Spacing.md,
  },
  userInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  userName: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  userEmail: {
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
    lineHeight: 20,
  },
});
