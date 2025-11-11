# TÓM TẮT KIẾN THỨC VÀ LUỒNG CHẠY DỰ ÁN INSTAGRAM

## 📋 MỤC LỤC

1. [Kiến trúc tổng quan](#kiến-trúc-tổng-quan)
2. [Luồng khởi động ứng dụng](#luồng-khởi-động-ứng-dụng)
3. [Quản lý Authentication](#quản-lý-authentication)
4. [State Management với React Query](#state-management-với-react-query)
5. [Navigation và Routing](#navigation-và-routing)
6. [API và HTTP Client](#api-và-http-client)
7. [WebSocket và Real-time Communication](#websocket-và-real-time-communication)
8. [Caching Strategy](#caching-strategy)
9. [Error Handling](#error-handling)
10. [Các Patterns quan trọng](#các-patterns-quan-trọng)

---

## 🏗️ KIẾN TRÚC TỔNG QUAN

### Cấu trúc thư mục

```
Instagram_Project/
├── app/                    # Expo Router - File-based routing
│   ├── _layout.tsx        # Root layout với providers
│   ├── (tabs)/            # Tab navigation
│   ├── auth/              # Auth screens
│   ├── message/           # Message screens
│   ├── post/              # Post screens
│   └── profile/           # Profile screens
├── components/            # Reusable components
├── contexts/              # React Context (AuthContext)
├── hooks/                 # Custom hooks
├── services/              # API services
├── utils/                 # Utility functions
├── types/                 # TypeScript types
└── constants/             # Constants và config
```

### Công nghệ sử dụng

- **Framework**: React Native với Expo Router
- **State Management**: TanStack React Query (v5)
- **Navigation**: Expo Router (file-based routing)
- **HTTP Client**: Axios
- **WebSocket**: Native WebSocket API
- **Storage**: AsyncStorage
- **UI**: React Native components + Expo vector icons

---

## 🚀 LUỒNG KHỞI ĐỘNG ỨNG DỤNG

### 1. Entry Point: `app/_layout.tsx`

```typescript
// Luồng khởi động:
1. RootLayout() được render đầu tiên
2. Setup các Providers:
   - GestureHandlerRootView (gesture handling)
   - ErrorBoundary (error catching)
   - QueryClientProvider (React Query)
   - ThemeProvider (dark/light theme)
   - AuthProvider (authentication state)
   - ToastProvider (toast notifications)
3. RootLayoutNav() xử lý navigation logic
```

### 2. Authentication Check Flow

```typescript
// Trong RootLayoutNav():
- useEffect theo dõi isAuthenticated và segments
- Nếu chưa authenticated và không ở auth group → redirect đến /auth/login
- Nếu đã authenticated và đang ở auth/index → redirect đến /(tabs)/home
- Khi logout: clear queryClient cache
```

### 3. Splash Screen

- `SplashScreen.preventAutoHideAsync()` ngăn auto hide
- Ẩn splash screen khi `isLoading = false` trong AuthContext

---

## 🔐 QUẢN LÝ AUTHENTICATION

### AuthContext (`contexts/AuthContext.tsx`)

#### State

- `isAuthenticated`: boolean - Trạng thái đăng nhập
- `isLoading`: boolean - Đang check auth
- `token`: string | null - JWT token

#### Các hàm chính:

1. **checkAuth()**:

   - Đọc token từ AsyncStorage
   - Kiểm tra token có hết hạn không (dùng `isTokenExpired`)
   - Nếu hết hạn → xóa token, set `isAuthenticated = false`
   - Nếu hợp lệ → set token vào axios headers

2. **login(token)**:

   - Lưu token vào AsyncStorage
   - Set token vào axios headers
   - Set `isAuthenticated = true`

3. **logout()**:

   - Xóa token khỏi AsyncStorage
   - Xóa token khỏi axios headers
   - Set `isAuthenticated = false`

4. **invalidateAuth()**:
   - Xóa token và reset state
   - Được gọi khi token hết hạn hoặc 401 error

### JWT Token Management (`utils/jwt.ts`)

- `isTokenExpired(token)`: Kiểm tra token có hết hạn không
- Parse JWT để lấy expiration time
- So sánh với current time

### Login Flow

```
1. User nhập email/password
2. Gọi useLogin() hook (React Query mutation)
3. Call loginApi() → POST /api/v1/auth/login
4. Nhận AuthResponse { accessToken }
5. Gọi authLogin(token) từ AuthContext
6. Token được lưu vào AsyncStorage
7. Navigation tự động chuyển đến /(tabs)/home
```

---

## 📊 STATE MANAGEMENT VỚI REACT QUERY

### QueryClient Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Các loại Query Keys

#### 1. User Data

- `["me"]` - Current user info
- `["user", userId]` - User by ID

#### 2. Posts

- `["posts", "feed", page, size]` - Home feed
- `["posts", "user", userId, page, size]` - User posts
- `["posts", "reels", page, size]` - Reels
- `["posts", postId]` - Single post

#### 3. Messages

- `["messages", "conversations"]` - Conversations list
- `["messages", "conversation", userId]` - Messages với user

#### 4. Notifications

- `["notifications"]` - Notifications list
- `["notifications", "unreadCount"]` - Unread count

#### 5. Friends

- `["friends"]` - Friends list
- `["friendRequests"]` - Friend requests

### Custom Hooks Pattern

#### Query Hooks (đọc dữ liệu)

```typescript
// Ví dụ: useFeed
export const useFeed = (page: number = 0, size: number = 10) => {
  return useQuery<Post[]>({
    queryKey: ["posts", "feed", page, size],
    queryFn: () => getFeedApi(page, size),
    staleTime: 0,
    keepPreviousData: page > 0,
  });
};
```

#### Mutation Hooks (thay đổi dữ liệu)

```typescript
// Ví dụ: useCreatePost
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePostRequest) => createPostApi(data),
    onSuccess: (newPost) => {
      // Optimistic update: thêm post mới vào cache
      queryClient.setQueriesData(/* update feed cache */);
      // Invalidate để refetch
      queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
    },
  });
};
```

### Optimistic Updates

#### Ví dụ: Toggle Reaction

```typescript
onMutate: async (postId) => {
  // Cancel ongoing queries
  await queryClient.cancelQueries({ queryKey: ["posts", postId] });

  // Update cache ngay lập tức (optimistic)
  queryClient.setQueryData(["posts", postId], (old) => ({
    ...old,
    hasReacted: !old.hasReacted,
    reactionCount: old.hasReacted ? old.reactionCount - 1 : old.reactionCount + 1,
  }));
},
onError: (error, postId) => {
  // Rollback nếu có lỗi
  queryClient.invalidateQueries({ queryKey: ["posts", postId] });
}
```

---

## 🧭 NAVIGATION VÀ ROUTING

### Expo Router (File-based Routing)

#### Cấu trúc Routes

```
app/
├── index.tsx              # Welcome screen (/)
├── _layout.tsx            # Root layout
├── (tabs)/                # Tab group
│   ├── _layout.tsx        # Tabs layout
│   ├── home.tsx           # /(tabs)/home
│   ├── search.tsx         # /(tabs)/search
│   ├── reels.tsx          # /(tabs)/reels
│   ├── create.tsx         # /(tabs)/create
│   ├── messages.tsx       # /(tabs)/messages
│   └── profile.tsx        # /(tabs)/profile
├── auth/
│   ├── login.tsx          # /auth/login
│   └── register.tsx       # /auth/register
└── post/
    └── detail/[id].tsx    # /post/detail/:id
```

### Navigation Guards

#### Trong RootLayoutNav:

```typescript
useEffect(() => {
  if (isLoading) return;

  const inAuthGroup = segments[0] === "auth";
  const isIndexPage = !segments[0];

  // Chưa đăng nhập → redirect đến login
  if (!isAuthenticated && !inAuthGroup && !isIndexPage) {
    router.replace("/auth/login");
  }
  // Đã đăng nhập → redirect đến home
  else if (isAuthenticated && (isIndexPage || inAuthGroup)) {
    router.replace("/(tabs)/home");
  }
}, [isAuthenticated, isLoading, segments]);
```

### Tab Navigation

#### Tab Layout (`app/(tabs)/_layout.tsx`)

- Sử dụng `Tabs` component từ expo-router
- 5 tabs chính: Home, Search, Reels, Create, Messages, Profile
- Một số tabs ẩn: index, activity, friend (truy cập qua navigation)

---

## 🌐 API VÀ HTTP CLIENT

### Axios Instance (`utils/axios-instance.ts`)

#### Configuration

```typescript
// Base URL: tự động normalize từ API_BASE và API_PREFIX
// Timeout: 15s (normal), 30s (upload)
// Headers: Content-Type, Accept, Authorization
```

#### Request Interceptor

```typescript
// Tự động thêm token vào headers nếu có
// Đọc token từ AsyncStorage nếu chưa có trong headers
```

#### Response Interceptor

```typescript
// Xử lý errors:
// - Timeout errors → user-friendly message
// - Network errors → "Kết nối bị ngắt"
// - 401 Unauthorized → invalidateAuth(), clear token
// - Other errors → pass through
```

### API Service Pattern (`services/api.ts`)

```typescript
// Wrapper function http<T>
async function http<T>(
  path: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  // Call axiosInstance
  // Parse response theo format ApiResponse<T>
  // Return { status, code, data }
}

// Export methods
export const api = {
  get: <T>(path: string, config?) =>
    http<T>(path, { method: "GET", ...config }),
  post: <T>(path: string, body?, config?) =>
    http<T>(path, { method: "POST", data: body, ...config }),
  put: <T>(path: string, body?, config?) =>
    http<T>(path, { method: "PUT", data: body, ...config }),
  patch: <T>(path: string, body?, config?) =>
    http<T>(path, { method: "PATCH", data: body, ...config }),
  delete: <T>(path: string, config?) =>
    http<T>(path, { method: "DELETE", ...config }),
};
```

### API Services Structure

#### Mỗi service có pattern:

```typescript
// services/post.api.ts
export const getFeedApi = async (
  page: number,
  size: number
): Promise<Post[]> => {
  const res = await api.get<Post[]>("/posts/feed", { params: { page, size } });
  return res.data;
};

export const createPostApi = async (data: CreatePostRequest): Promise<Post> => {
  const res = await api.post<Post>("/posts", data);
  return res.data;
};
```

---

## 🔌 WEBSOCKET VÀ REAL-TIME COMMUNICATION

### WebSocket Service (`services/websocket.ts`)

#### Connection Flow

```
1. websocketService.connect() được gọi
2. Đọc token từ AsyncStorage
3. Build WebSocket URL: ws://{host}/ws/messages?token={token}
4. Tạo WebSocket connection
5. Setup event handlers:
   - onopen: connection established
   - onmessage: nhận messages từ server
   - onerror: handle errors
   - onclose: handle disconnection, auto reconnect
```

#### Reconnection Strategy

```typescript
// Exponential backoff: 1s, 2s, 4s, 8s, ... tối đa 30s
// Max reconnect attempts: 5
// Chỉ reconnect nếu không phải normal closure (code !== 1000)
```

#### Message Types

```typescript
interface WebSocketMessage {
  type:
    | "new_message"
    | "message_sent"
    | "message_read"
    | "typing"
    | "user_online"
    | "user_offline";
  message?: any;
  userId?: string;
  data?: any;
}
```

### useWebSocket Hook (`hooks/useWebSocket.ts`)

```typescript
// Kết nối WebSocket khi component mount
// Listen cho 'message' event
// Update React Query cache khi nhận message mới:
//   - Thêm message vào conversation cache
//   - Invalidate conversations list để update last message
```

### Integration với React Query

```typescript
// Khi nhận message mới qua WebSocket:
queryClient.setQueryData(
  ["messages", "conversation", userId],
  (oldMessages) => {
    // Check duplicate
    if (oldMessages.some((m) => m.id === message.id)) return oldMessages;
    // Add new message
    return [...oldMessages, message];
  }
);

// Invalidate conversations list
queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
```

---

## 💾 CACHING STRATEGY

### React Query Cache Configuration

#### Stale Time

- `staleTime: 0` - Luôn coi là stale (feed, posts)
- `staleTime: 5 * 60 * 1000` - 5 phút (user info)
- `staleTime: 30 * 1000` - 30 giây (reels)

#### GC Time (Garbage Collection)

- `gcTime: 10 * 60 * 1000` - 10 phút (default)
- Data được giữ trong cache sau khi không còn được sử dụng

#### Keep Previous Data

- `keepPreviousData: true` - Giữ data cũ khi đang fetch data mới (pagination)

### Cache Update Strategies

#### 1. Optimistic Updates

```typescript
// Update cache ngay lập tức trước khi server phản hồi
onMutate: async (postId) => {
  queryClient.setQueryData(["posts", postId], (old) => ({
    ...old,
    hasReacted: !old.hasReacted,
  }));
};
```

#### 2. Invalidate và Refetch

```typescript
// Đánh dấu cache là stale và refetch
queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
```

#### 3. Direct Cache Update

```typescript
// Cập nhật cache trực tiếp từ response
queryClient.setQueryData(["posts", postId], newPost);
```

#### 4. Set Queries Data (Multiple Queries)

```typescript
// Update nhiều queries cùng lúc
queryClient.setQueriesData(
  { predicate: (query) => query.queryKey[0] === 'posts' },
  (old) => /* update logic */
);
```

### Cache Invalidation Patterns

#### Khi tạo post mới:

```typescript
1. Optimistic update: thêm post vào feed cache
2. Invalidate feed queries để refetch
3. Invalidate user posts để update profile
```

#### Khi xóa post:

```typescript
1. Optimistic update: remove post khỏi tất cả cache
2. Invalidate tất cả post-related queries
```

#### Khi update post:

```typescript
1. Invalidate post detail query
2. Invalidate feed queries
3. Invalidate user posts queries
```

---

## ⚠️ ERROR HANDLING

### Axios Interceptor Error Handling

#### Network Errors

```typescript
// Không có response từ server
if (!error.response) {
  if (error.code === "ERR_NETWORK" || error.code === "ECONNREFUSED") {
    return Promise.reject(
      new Error("Kết nối bị ngắt. Vui lòng kiểm tra kết nối mạng.")
    );
  }
}
```

#### Timeout Errors

```typescript
if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
  return Promise.reject(
    new Error(
      "Kết nối máy chủ quá thời gian. Vui lòng kiểm tra mạng hoặc thử lại."
    )
  );
}
```

#### 401 Unauthorized

```typescript
if (status === 401) {
  // Clear token
  await invalidateAuth();
  // Return user-friendly error
  return Promise.reject(
    new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
  );
}
```

### React Query Error Handling

#### Retry Logic

```typescript
retry: (failureCount, error) => {
  // Don't retry on 401
  if (error?.response?.status === 401) {
    invalidateAuth();
    return false;
  }
  // Don't retry on network errors
  if (!error?.response && error?.code === "ERR_NETWORK") {
    return false;
  }
  // Retry up to 2 times for other errors
  return failureCount < 2;
};
```

#### Error Display

- Toast notifications cho user-facing errors
- Console logs cho development errors
- Error boundaries cho unhandled errors

### Error Boundary (`components/ErrorBoundary.tsx`)

- Catch React errors
- Display fallback UI
- Log errors để debug

---

## 🎯 CÁC PATTERNS QUAN TRỌNG

### 1. Custom Hooks Pattern

#### Data Fetching Hook

```typescript
export const useFeed = (page: number, size: number) => {
  return useQuery({
    queryKey: ["posts", "feed", page, size],
    queryFn: () => getFeedApi(page, size),
    // ... options
  });
};
```

#### Mutation Hook

```typescript
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => createPostApi(data),
    onSuccess: (newPost) => {
      // Update cache
      queryClient.setQueryData(/* ... */);
      // Invalidate
      queryClient.invalidateQueries(/* ... */);
    },
  });
};
```

### 2. Infinite Scroll Pattern

```typescript
// Trong component:
const [page, setPage] = useState(0);
const [allPosts, setAllPosts] = useState<Post[]>([]);
const { data: posts } = useFeed(page, 10);

// Accumulate posts
useEffect(() => {
  if (posts) {
    if (page === 0) {
      setAllPosts(posts);
    } else {
      setAllPosts((prev) => [...prev, ...posts]);
    }
  }
}, [posts, page]);

// Load more khi scroll đến cuối
const handleLoadMore = () => {
  if (!isFetching && posts && posts.length >= 10) {
    setPage((prev) => prev + 1);
  }
};
```

### 3. Optimistic Updates Pattern

```typescript
onMutate: async (variables) => {
  // Cancel ongoing queries
  await queryClient.cancelQueries({ queryKey: ['posts'] });

  // Snapshot previous value
  const previousData = queryClient.getQueryData(['posts', postId]);

  // Optimistic update
  queryClient.setQueryData(['posts', postId], (old) => ({
    ...old,
    /* updated fields */
  }));

  return { previousData };
},
onError: (error, variables, context) => {
  // Rollback
  queryClient.setQueryData(['posts', postId], context.previousData);
},
onSettled: () => {
  // Refetch để đảm bảo sync
  queryClient.invalidateQueries({ queryKey: ['posts', postId] });
}
```

### 4. Form Handling Pattern

```typescript
// State management
const [formData, setFormData] = useState({ email: "", password: "" });
const [errors, setErrors] = useState({});

// Validation
const validate = () => {
  const newErrors = {};
  if (!formData.email) newErrors.email = "Email không được để trống";
  if (!formData.password) newErrors.password = "Mật khẩu không được để trống";
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

// Submit
const handleSubmit = () => {
  if (!validate()) return;
  mutation.mutate(formData, {
    onSuccess: (data) => {
      // Handle success
    },
    onError: (error) => {
      // Handle error, map server errors to form errors
      setErrors(/* map errors */);
    },
  });
};
```

### 5. Pull-to-Refresh Pattern

```typescript
const handleRefresh = async () => {
  // Reset page
  setPage(0);
  // Invalidate và refetch
  await queryClient.invalidateQueries({
    queryKey: ["posts", "feed", 0, 10],
    refetchType: "active",
  });
  await refetch();
};

<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={isLoading && page === 0}
      onRefresh={handleRefresh}
    />
  }
>
  {/* content */}
</ScrollView>;
```

### 6. Focus Refetch Pattern

```typescript
useFocusEffect(
  React.useCallback(() => {
    // Skip refetch on initial mount
    if (isFirstFocus.current) {
      isFirstFocus.current = false;
      return;
    }
    // Refetch when screen is focused
    if (page === 0) {
      const timer = setTimeout(() => {
        refetch();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [page, refetch])
);
```

### 7. WebSocket Integration Pattern

```typescript
// Trong component:
useEffect(() => {
  // Connect WebSocket
  websocketService.connect();

  // Listen for messages
  const handleMessage = (data: WebSocketMessage) => {
    if (data.type === "new_message") {
      // Update React Query cache
      queryClient.setQueryData(
        ["messages", "conversation", data.userId],
        (old) => [...old, data.message]
      );
      // Invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: ["messages", "conversations"],
      });
    }
  };

  websocketService.on("message", handleMessage);

  return () => {
    websocketService.off("message", handleMessage);
  };
}, []);
```

---

## 📝 GHI CHÚ QUAN TRỌNG

### 1. Token Management

- Token được lưu trong AsyncStorage
- Token được thêm vào axios headers tự động
- Token được kiểm tra expiration trước khi sử dụng
- Khi token hết hạn (401), tự động clear và redirect đến login

### 2. Cache Management

- Sử dụng React Query để quản lý cache
- Optimistic updates cho UX tốt hơn
- Invalidate cache khi cần sync với server
- Clear cache khi logout

### 3. Error Handling

- User-friendly error messages (tiếng Việt)
- Automatic retry cho một số errors
- Error boundaries để catch React errors
- Toast notifications cho user-facing errors

### 4. Performance

- Lazy loading với pagination
- Optimistic updates để giảm latency
- Cache để giảm API calls
- Keep previous data khi paginate

### 5. Real-time Updates

- WebSocket cho messages real-time
- Auto reconnect khi disconnect
- Update React Query cache từ WebSocket messages
- Invalidate queries để sync với server

---

## 🔗 CÁC FILE QUAN TRỌNG

### Core Files

- `app/_layout.tsx` - Root layout, providers, navigation guards
- `contexts/AuthContext.tsx` - Authentication state management
- `utils/axios-instance.ts` - HTTP client configuration
- `services/websocket.ts` - WebSocket service
- `services/api.ts` - API wrapper

### Hooks

- `hooks/useAuth.ts` - Authentication hooks
- `hooks/usePost.ts` - Post-related hooks
- `hooks/useWebSocket.ts` - WebSocket hook
- `hooks/useMessage.ts` - Message hooks
- `hooks/useNotification.ts` - Notification hooks

### Services

- `services/auth.api.ts` - Auth API calls
- `services/post.api.ts` - Post API calls
- `services/message.api.ts` - Message API calls
- `services/user.api.ts` - User API calls

### Utils

- `utils/jwt.ts` - JWT token utilities
- `utils/error.ts` - Error handling utilities
- `utils/validation.ts` - Validation utilities

### Constants

- `constants/config.ts` - API configuration
- `constants/colors.ts` - Color constants
- `constants/styles.ts` - Style constants

---

## 🎓 KẾT LUẬN

Dự án này sử dụng các pattern và best practices sau:

1. **React Query** cho state management và caching
2. **Expo Router** cho file-based routing
3. **Context API** cho authentication state
4. **Axios** với interceptors cho HTTP requests
5. **WebSocket** cho real-time communication
6. **Optimistic Updates** cho UX tốt hơn
7. **Error Handling** toàn diện
8. **TypeScript** cho type safety

Các pattern này giúp code dễ maintain, scale, và có UX tốt.

---
