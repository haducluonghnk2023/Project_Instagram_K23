import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Spacing, FontSizes } from "@/constants/styles";
import { useUpdatePost, useDeletePost } from "@/hooks/usePost";
import { Post } from "@/types/post";
import VisibilityModal from "./VisibilityModal";
import { ConfirmDialog } from "@/components/common";
import { useToast } from "@/components/common/ToastProvider";
import { showErrorFromException } from "@/utils/toast";

interface PostMenuProps {
  post: Post;
  currentUserId: string;
  visible: boolean;
  onClose: () => void;
}

export default function PostMenu({
  post,
  currentUserId,
  visible,
  onClose,
}: PostMenuProps) {
  const { mutate: updatePost, isPending: isUpdating } = useUpdatePost();
  const { mutate: deletePost, isPending: isDeleting } = useDeletePost();
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { showToast } = useToast();

  // Chỉ hiển thị menu cho chủ bài viết
  const isOwner = post.userId === currentUserId;

  if (!isOwner) {
    return null;
  }

  const handleChangeVisibility = () => {
    setShowVisibilityModal(true);
    onClose();
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
    onClose();
  };

  const confirmDelete = () => {
    deletePost(post.id, {
      onSuccess: () => {
        showToast("Đã xóa bài viết", "success");
      },
      onError: (error: any) => {
        const { message } = showErrorFromException(error, "Không thể xóa bài viết");
        showToast(message, "error");
      },
    });
    setShowDeleteConfirm(false);
  };

  const handleVisibilityChange = (visibility: "public" | "private" | "friends") => {
    updatePost(
      {
        postId: post.id,
        data: { visibility },
      },
      {
        onSuccess: () => {
          showToast("Đã thay đổi quyền xem bài viết", "success");
          setShowVisibilityModal(false);
        },
        onError: (error: any) => {
          const { message } = showErrorFromException(error, "Không thể thay đổi quyền xem");
          showToast(message, "error");
        },
      }
    );
  };

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case "public":
        return "Công khai";
      case "private":
        return "Riêng tư";
      case "friends":
        return "Bạn bè";
      default:
        return "Công khai";
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "public":
        return "globe-outline";
      case "private":
        return "lock-closed-outline";
      case "friends":
        return "people-outline";
      default:
        return "globe-outline";
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleChangeVisibility}
              disabled={isUpdating}
            >
              <Ionicons
                name={getVisibilityIcon(post.visibility)}
                size={20}
                color={Colors.text}
              />
              <Text style={styles.menuItemText}>
                Đổi quyền xem ({getVisibilityLabel(post.visibility)})
              </Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={[styles.menuItem, styles.deleteMenuItem]}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
              <Text style={[styles.menuItemText, styles.deleteText]}>
                Xóa bài viết
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.cancelItem]}
              onPress={onClose}
            >
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <VisibilityModal
        visible={showVisibilityModal}
        currentVisibility={post.visibility as "public" | "private" | "friends"}
        onSelect={handleVisibilityChange}
        onClose={() => setShowVisibilityModal(false)}
        isUpdating={isUpdating}
      />

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Xóa bài viết"
        message="Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    width: "80%",
    maxWidth: 400,
    paddingVertical: Spacing.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  menuItemText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    flex: 1,
  },
  deleteMenuItem: {
    // No special styling needed
  },
  deleteText: {
    color: Colors.error,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.xs,
  },
  cancelItem: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    justifyContent: "center",
  },
  cancelText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    textAlign: "center",
    fontWeight: "600",
  },
});

