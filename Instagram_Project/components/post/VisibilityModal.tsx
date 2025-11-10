import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Spacing, FontSizes } from "@/constants/styles";

interface VisibilityModalProps {
  visible: boolean;
  currentVisibility: "public" | "private" | "friends";
  onSelect: (visibility: "public" | "private" | "friends") => void;
  onClose: () => void;
  isUpdating?: boolean;
}

export default function VisibilityModal({
  visible,
  currentVisibility,
  onSelect,
  onClose,
  isUpdating = false,
}: VisibilityModalProps) {
  const options: Array<{
    value: "public" | "private" | "friends";
    label: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
  }> = [
    {
      value: "public",
      label: "Công khai",
      description: "Mọi người có thể xem bài viết này",
      icon: "globe-outline",
    },
    {
      value: "friends",
      label: "Bạn bè",
      description: "Chỉ bạn bè có thể xem bài viết này",
      icon: "people-outline",
    },
    {
      value: "private",
      label: "Riêng tư",
      description: "Chỉ bạn có thể xem bài viết này",
      icon: "lock-closed-outline",
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Đổi quyền xem</Text>
            <TouchableOpacity onPress={onClose} disabled={isUpdating}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsContainer}>
            {options.map((option) => {
              const isSelected = option.value === currentVisibility;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionItem,
                    isSelected && styles.optionItemSelected,
                  ]}
                  onPress={() => onSelect(option.value)}
                  disabled={isUpdating || isSelected}
                >
                  <View style={styles.optionLeft}>
                    <Ionicons
                      name={option.icon}
                      size={24}
                      color={isSelected ? Colors.primary : Colors.text}
                    />
                    <View style={styles.optionTextContainer}>
                      <Text
                        style={[
                          styles.optionLabel,
                          isSelected && styles.optionLabelSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text style={styles.optionDescription}>
                        {option.description}
                      </Text>
                    </View>
                  </View>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={Colors.primary}
                    />
                  )}
                  {isUpdating && !isSelected && (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {isUpdating && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Đang cập nhật...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Spacing.xl,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    color: Colors.text,
  },
  optionsContainer: {
    paddingVertical: Spacing.md,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  optionItemSelected: {
    backgroundColor: Colors.primaryLight + "20",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  optionLabelSelected: {
    color: Colors.primary,
  },
  optionDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  loadingText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
});

