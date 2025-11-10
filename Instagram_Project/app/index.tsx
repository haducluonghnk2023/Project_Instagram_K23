import { Button, Logo } from "@/components/common";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CommonStyles, Spacing } from "@/constants/styles";
import { Link } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  return (
    <ThemedView
      style={[CommonStyles.container, CommonStyles.containerCentered]}
    >
      <SafeAreaView edges={["top", "bottom"]} style={CommonStyles.container}>
        <View style={styles.content}>
          <Logo size={80} />

          <ThemedText type="title" style={styles.title}>
            Instagram
          </ThemedText>

          <ThemedText style={styles.subtitle}>
            Chào mừng bạn đến với Instagram
          </ThemedText>

          <View style={styles.buttonContainer}>
            <Link href="/auth/login" asChild>
              <Button title="Đăng nhập" variant="primary" />
            </Link>

            <Link href="/auth/register" asChild>
              <Button title="Đăng ký" variant="outline" />
            </Link>
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: 400,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  title: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    fontSize: 36,
    fontWeight: "bold",
  },
  subtitle: {
    marginBottom: Spacing.xl * 2,
    textAlign: "center",
    opacity: 0.7,
    paddingHorizontal: Spacing.lg,
  },
  buttonContainer: {
    width: 160,
    gap: Spacing.md,
    paddingHorizontal: 0,
  },
});
