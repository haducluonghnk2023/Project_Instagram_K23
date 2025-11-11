import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/colors";
import { Spacing, FontSizes } from "@/constants/styles";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthContext } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/common";
import { useToast } from "@/components/common/ToastProvider";
import { SwipeBackView } from "@/components/common";
import { Avatar } from "@/components/common";
import { useMe } from "@/hooks/useAuth";

interface SettingsItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  rightComponent?: React.ReactNode;
  danger?: boolean;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  rightComponent,
  danger = false,
}) => {
  return (
    <TouchableOpacity
      style={styles.settingsItem}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.settingsItemLeft}>
        <Ionicons
          name={icon as any}
          size={24}
          color={danger ? Colors.error : Colors.text}
        />
        <View style={styles.settingsItemText}>
          <Text
            style={[
              styles.settingsItemTitle,
              danger && { color: Colors.error },
            ]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      {rightComponent || (showArrow && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={Colors.textSecondary}
        />
      ))}
    </TouchableOpacity>
  );
};

const SettingsSection: React.FC<{
  title?: string;
  children: React.ReactNode;
}> = ({ title, children }) => {
  return (
    <View style={styles.section}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
};

export default function SettingsScreen() {
  const { logout } = useAuthContext();
  const { data: userInfo } = useMe();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { showToast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

  const profile = userInfo?.profile;
  const username = userInfo?.email?.split("@")[0] || "username";
  const fullName = profile?.fullName || userInfo?.email || "Chưa có tên";
  const avatar = profile?.avatarUrl || null;

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      await logout();
      setShowLogoutConfirm(false);
      // Navigation sẽ được xử lý tự động bởi RootLayoutNav khi isAuthenticated = false
    } catch (error) {
      setShowLogoutConfirm(false);
      showToast("Không thể đăng xuất. Vui lòng thử lại.", "error");
    }
  };

  return (
    <SwipeBackView enabled={true} style={styles.container}>
      <ThemedView style={styles.container}>
        <SafeAreaView edges={["top"]} style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerIcon}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Cài đặt</Text>
            <View style={styles.headerIcon} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
          >
            {/* Account Section */}
            <SettingsSection>
              <View style={styles.accountSection}>
                <Avatar source={avatar} size={60} showBorder={false} />
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{fullName}</Text>
                  <Text style={styles.accountUsername}>@{username}</Text>
                </View>
              </View>
            </SettingsSection>

            {/* Account Actions */}
            <SettingsSection title="Tài khoản">
              <SettingsItem
                icon="person-outline"
                title="Chỉnh sửa trang cá nhân"
                onPress={() => router.push("/profile/edit")}
              />
              <SettingsItem
                icon="lock-closed-outline"
                title="Đổi mật khẩu"
                onPress={() => router.push("/profile/change-password")}
              />
              <SettingsItem
                icon="people-outline"
                title="Người theo dõi và người bạn đang theo dõi"
                onPress={() => router.push("/profile/followers")}
              />
              <SettingsItem
                icon="bookmark-outline"
                title="Bài viết đã lưu"
                onPress={() => {
                  showToast("Tính năng bài viết đã lưu sẽ được thêm sau", "info");
                }}
              />
            </SettingsSection>

            {/* Privacy & Security */}
            <SettingsSection title="Quyền riêng tư và bảo mật">
              <SettingsItem
                icon="lock-closed-outline"
                title="Quyền riêng tư"
                subtitle="Kiểm soát ai có thể xem nội dung của bạn"
                onPress={() => {
                  showToast("Tính năng quyền riêng tư sẽ được thêm sau", "info");
                }}
              />
              <SettingsItem
                icon="eye-outline"
                title="Hoạt động của bạn"
                subtitle="Quản lý những gì bạn chia sẻ và xem"
                onPress={() => {
                  showToast("Tính năng hoạt động sẽ được thêm sau", "info");
                }}
              />
              <SettingsItem
                icon="shield-checkmark-outline"
                title="Bảo mật tài khoản"
                onPress={() => {
                  showToast("Tính năng bảo mật sẽ được thêm sau", "info");
                }}
              />
            </SettingsSection>

            {/* Notifications */}
            <SettingsSection title="Thông báo">
              <SettingsItem
                icon="notifications-outline"
                title="Thông báo đẩy"
                rightComponent={
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{
                      false: Colors.border,
                      true: Colors.primary + "80",
                    }}
                    thumbColor={
                      notificationsEnabled ? Colors.primary : Colors.textSecondary
                    }
                  />
                }
                showArrow={false}
              />
              <SettingsItem
                icon="mail-outline"
                title="Email"
                rightComponent={
                  <Switch
                    value={emailNotifications}
                    onValueChange={setEmailNotifications}
                    trackColor={{
                      false: Colors.border,
                      true: Colors.primary + "80",
                    }}
                    thumbColor={
                      emailNotifications ? Colors.primary : Colors.textSecondary
                    }
                  />
                }
                showArrow={false}
              />
            </SettingsSection>

            {/* Content & Activity */}
            <SettingsSection title="Nội dung và hoạt động">
              <SettingsItem
                icon="archive-outline"
                title="Kho lưu trữ"
                onPress={() => {
                  showToast("Tính năng kho lưu trữ sẽ được thêm sau", "info");
                }}
              />
              <SettingsItem
                icon="time-outline"
                title="Lịch sử hoạt động"
                onPress={() => {
                  showToast("Tính năng lịch sử sẽ được thêm sau", "info");
                }}
              />
            </SettingsSection>

            {/* Support */}
            <SettingsSection title="Hỗ trợ">
              <SettingsItem
                icon="help-circle-outline"
                title="Trung tâm trợ giúp"
                onPress={() => {
                  showToast("Trung tâm trợ giúp sẽ được thêm sau", "info");
                }}
              />
              <SettingsItem
                icon="information-circle-outline"
                title="Về chúng tôi"
                onPress={() => {
                  showToast("Thông tin về ứng dụng sẽ được thêm sau", "info");
                }}
              />
            </SettingsSection>

            {/* Logout */}
            <SettingsSection>
              <SettingsItem
                icon="log-out-outline"
                title="Đăng xuất"
                onPress={handleLogout}
                danger
              />
            </SettingsSection>

            {/* App Version */}
            <View style={styles.versionContainer}>
              <Text style={styles.versionText}>Instagram v1.0.0</Text>
            </View>
          </ScrollView>
        </SafeAreaView>

        <ConfirmDialog
          visible={showLogoutConfirm}
          title="Đăng xuất"
          message="Bạn có chắc chắn muốn đăng xuất?"
          confirmText="Đăng xuất"
          cancelText="Hủy"
          type="warning"
          onConfirm={confirmLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      </ThemedView>
    </SwipeBackView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  headerIcon: {
    padding: Spacing.xs,
    width: 40,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
  },
  sectionContent: {
    backgroundColor: Colors.background,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.borderLight,
  },
  settingsItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
  },
  settingsItemText: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: FontSizes.md,
    fontWeight: "400",
    color: Colors.text,
  },
  settingsItemSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  accountSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  accountUsername: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  versionContainer: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  versionText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
});

