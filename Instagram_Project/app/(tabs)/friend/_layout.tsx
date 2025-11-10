import { Stack } from "expo-router";

export default function FriendLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        // Tabs sẽ tự động hiển thị vì đang ở trong (tabs) group
      }} 
    />
  );
}

