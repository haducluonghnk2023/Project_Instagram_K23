import { Input, Button, Logo } from "@/components/common";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CommonStyles, Spacing } from "@/constants/styles";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");

  const handleSubmit = () => {
    if (!email.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập email");
      return;
    }
    Alert.alert("Gửi yêu cầu", "Nếu email tồn tại, liên kết đặt lại sẽ được gửi.");
  };

  return (
    <ThemedView style={CommonStyles.container}>
      <SafeAreaView edges={["top", "bottom"]} style={CommonStyles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={CommonStyles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Logo size={64} />
              <ThemedText type="title" style={styles.title}>Quên mật khẩu</ThemedText>
            </View>
            <Input placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <Button title="Gửi liên kết đặt lại" onPress={handleSubmit} variant="primary" fullWidth />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: Spacing.lg },
  header: { alignItems: "center", marginBottom: Spacing.xl },
  title: { fontSize: 24, fontWeight: "bold" },
});


