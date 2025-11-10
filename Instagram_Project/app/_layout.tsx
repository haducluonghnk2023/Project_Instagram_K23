import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import "react-native-reanimated";
import { AuthProvider, useAuthContext } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/common/ToastProvider";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuthContext();
  const segments = useSegments();
  const router = useRouter();
  const prevAuthenticated = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === "auth";
    const wasAuthenticated = prevAuthenticated.current;
    const nowAuthenticated = isAuthenticated;

    // Nếu logout (chuyển từ authenticated sang không authenticated), clear cache
    if (wasAuthenticated === true && nowAuthenticated === false) {
      queryClient.clear();
    }

    // Update ref sau khi xử lý
    prevAuthenticated.current = isAuthenticated;

    // Kiểm tra xem có đang ở trang index (trang chào mừng) không
    // Trang index có segments rỗng hoặc không có segments[0]
    const isIndexPage = !segments[0];

    // Nếu chưa đăng nhập và không ở trang auth/index, chuyển đến login
    if (!isAuthenticated && !inAuthGroup && !isIndexPage) {
      router.replace("/auth/login");
    }
    // Nếu đã đăng nhập (có token), tự động vào trang chính
    else if (isAuthenticated && (isIndexPage || inAuthGroup)) {
      router.replace("/(tabs)/home");
    }
  }, [isAuthenticated, isLoading, segments]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return null;
  }

  return <Slot />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <AuthProvider>
            <ToastProvider>
              <RootLayoutNav />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
