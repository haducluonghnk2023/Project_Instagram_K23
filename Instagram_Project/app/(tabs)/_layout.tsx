import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Colors } from "@/constants/colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#000",
        tabBarStyle: Platform.select({
          ios: { 
            height: 88 + (insets.bottom > 0 ? 0 : 8),
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          },
          default: {
            backgroundColor: "#e2cdcdff",
            borderTopWidth: 0.5,
            borderTopColor: "#e0e0e0",
            paddingBottom: Math.max(insets.bottom, 8),
            height: 60 + Math.max(insets.bottom, 8),
          },
        }),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              name="house.fill"
              color={focused ? "#000" : "#000"}
              size={focused ? 28 : 24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name="compass-outline"
              color={focused ? "#000" : "#000"}
              size={focused ? 28 : 24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reels"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name="videocam-outline"
              color={focused ? "#000" : "#000"}
              size={focused ? 28 : 24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name="add"
              color={focused ? "#000" : "#000"}
              size={focused ? 32 : 28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              name="paperplane.fill"
              color={focused ? "#000" : "#000"}
              size={focused ? 28 : 24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              name="person.circle.fill"
              color={focused ? "#000" : "#8e8e8e"}
              size={focused ? 28 : 24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Ẩn tab index
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          href: null, // Ẩn tab activity
        }}
      />
      <Tabs.Screen
        name="friend"
        options={{
          href: null, // Ẩn tab friend (truy cập từ profile)
        }}
      />
    </Tabs>
  );
}
