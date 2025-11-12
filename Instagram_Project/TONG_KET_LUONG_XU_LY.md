# Tóm Tắt Các Luồng Quan Trọng và Cách Xử Lý

## 1. Luồng Xác Thực (Authentication Flow)

### 1.1. Kiến trúc
- **Context**: `AuthContext` quản lý trạng thái đăng nhập toàn cục
- **Storage**: Token được lưu trong `AsyncStorage` với key `"token"`
- **Validation**: Kiểm tra token hết hạn bằng JWT utils

### 1.2. Quy trình đăng nhập
```
1. User nhập email/password → Login Screen
2. Validate input (email format, password không rỗng)
3. Gọi API `/auth/login` → auth.api.ts
4. Nhận token từ response
5. Lưu token vào AsyncStorage
6. Set token vào axios headers (setAuthToken)
7. Update AuthContext state (isAuthenticated = true)
8. RootLayoutNav tự động redirect đến /(tabs)/home
```

### 1.3. Quy trình đăng xuất
```
1. User click logout
2. Xóa token khỏi AsyncStorage
3. Clear token khỏi axios headers
4. Update AuthContext (isAuthenticated = false)
5. Clear React Query cache (queryClient.clear())
6. Redirect về trang login
```

### 1.4. Xử lý token hết hạn
- **Interceptor**: Tự động phát hiện 401 Unauthorized
- **Xử lý**: 
  - Gọi `invalidateAuth()` để clear token
  - Hiển thị thông báo "Phiên đăng nhập đã hết hạn"
  - Redirect về login (trừ các endpoint public)

### 1.5. Bảo vệ route
- **RootLayoutNav**: Kiểm tra `isAuthenticated` và `segments`
- **Logic**: 
  - Chưa đăng nhập + không ở trang auth → redirect `/auth/login`
  - Đã đăng nhập + ở trang auth/index → redirect `/(tabs)/home`

---

## 2. Luồng API Request (HTTP Request Flow)

### 2.1. Cấu trúc
- **Base Instance**: `axiosInstance` (timeout 15s) cho requests thường
- **Upload Instance**: `uploadAxiosInstance` (timeout 120s) cho upload files
- **Base URL**: Tự động normalize từ `API_BASE` và `API_PREFIX`

### 2.2. Request Interceptor
```typescript
// Tự động thêm token vào headers nếu chưa có
- Lấy token từ AsyncStorage
- Thêm vào header: Authorization: Bearer {token}
```

### 2.3. Response Interceptor
**Xử lý lỗi:**
- **Timeout**: Hiển thị "Kết nối máy chủ quá thời gian"
- **Network Error**: Hiển thị "Kết nối bị ngắt. Vui lòng kiểm tra mạng"
- **401 Unauthorized**: 
  - Clear token (trừ public endpoints)
  - Hiển thị "Phiên đăng nhập đã hết hạn"
- **Các lỗi khác**: Pass through để component xử lý

### 2.4. API Wrapper
- **Function**: `api.get/post/put/patch/delete<T>()`
- **Response Format**: `ApiResponse<T> { status, code, data }`
- **Normalization**: Tự động xử lý các format response khác nhau

---

## 3. Luồng WebSocket (Real-time Messaging)

### 3.1. Kết nối
- **Service**: `WebSocketService` singleton
- **Endpoint**: `ws://{host}/ws/messages?token={token}`
- **Protocol**: Native WebSocket (không dùng SockJS)

### 3.2. Quy trình kết nối
```
1. Lấy token từ AsyncStorage
2. Build WebSocket URL từ API_BASE
3. Tạo WebSocket connection
4. onopen: Reset reconnect attempts, notify listeners
5. onmessage: Parse JSON, emit đến listeners
6. onerror: Log error, schedule reconnect
7. onclose: Schedule reconnect nếu không phải normal closure
```

### 3.3. Reconnect Logic
- **Max Attempts**: 5 lần
- **Backoff Strategy**: Exponential (1s, 2s, 4s, 8s, max 30s)
- **Tự động reconnect**: Khi connection bị đóng bất thường

### 3.4. Message Types
- `new_message`: Tin nhắn mới nhận được
- `message_sent`: Tin nhắn đã gửi thành công
- `message_read`: Tin nhắn đã được đọc
- `typing`: User đang gõ
- `user_online/offline`: Trạng thái online

### 3.5. Hook Integration
- **useWebSocket**: Hook để sử dụng WebSocket trong components
- **Cache Update**: Tự động update React Query cache khi nhận message
- **Query Invalidation**: Invalidate conversations list để refresh UI

---

## 4. Luồng Post (Bài Viết)

### 4.1. Tạo Post
```
1. User chọn ảnh/video → Image/Video Picker
2. Upload media → upload.api.ts (uploadImageApi/uploadVideoApi)
3. Nhận URL từ server
4. Tạo post với media URL → post.api.ts (createPostApi)
5. Optimistic Update: Thêm post vào đầu feed cache
6. Invalidate queries: Feed, User Posts
```

### 4.2. Xem Feed
- **Hook**: `useFeed(page, size)` với pagination
- **Query Key**: `["posts", "feed", page, size]`
- **Cache Strategy**: 
  - `staleTime: 0` (luôn coi là stale)
  - `keepPreviousData: true` khi load more (page > 0)

### 4.3. Xóa Post
- **Optimistic Update**: Xóa post khỏi tất cả cache queries
- **Invalidate**: Feed, User Posts, Reels, Post Detail

### 4.4. Cập nhật Post
- **Invalidate**: Post detail, Feed, User Posts

### 4.5. Cache Management
- **Query Keys**:
  - `["posts", "feed", page, size]` - Feed pagination
  - `["posts", "user", userId, page, size]` - User posts
  - `["posts", "reels", page, size]` - Reels feed
  - `["posts", postId]` - Post detail

---

## 5. Luồng Tin Nhắn (Messaging)

### 5.1. Gửi Tin Nhắn
```
1. User nhập message → Chat Screen
2. Gọi API POST /messages → message.api.ts
3. WebSocket nhận message_sent event
4. Update cache: Thêm message vào conversation cache
5. Invalidate conversations list
```

### 5.2. Nhận Tin Nhắn Real-time
```
1. WebSocket nhận new_message event
2. useWebSocket hook xử lý
3. Update conversation cache (setQueryData)
4. Invalidate conversations list
5. UI tự động update
```

### 5.3. Đánh Dấu Đã Đọc
- **Single Message**: `markMessageAsReadApi(messageId)`
- **All Messages**: `markAllAsReadApi(otherUserId)`
- **Cache Update**: Invalidate conversation và conversations list

### 5.4. Xóa Tin Nhắn
- **API**: DELETE `/messages/{messageId}`
- **Cache**: Invalidate conversation và conversations list

### 5.5. Query Keys
- `["messages", "conversations"]` - Danh sách conversations
- `["messages", "conversation", otherUserId]` - Messages trong conversation

---

## 6. Luồng Bạn Bè (Friend Management)

### 6.1. Gửi Friend Request
```
1. User search bằng phone → searchUsersApi
2. Gửi request → sendFriendRequestApi
3. Invalidate: friendRequests, friends queries
```

### 6.2. Chấp Nhận/Từ Chối Request
- **Accept**: `acceptFriendRequestApi(requestId)`
- **Reject**: `rejectFriendRequestApi(requestId)`
- **Cancel**: `cancelFriendRequestApi(requestId)`
- **Cache**: Invalidate friendRequests, friends

### 6.3. Block/Unblock User
- **Block**: `blockUserApi({ userId })`
- **Unblock**: `unblockUserApi(blockedUserId)`
- **Cache**: Invalidate blockedUsers, friends

### 6.4. Unfriend
- **API**: DELETE `/friends/{friendId}`
- **Cache**: Invalidate friends, friendRequests

### 6.5. Query Keys
- `["friends"]` - Danh sách bạn bè của user hiện tại
- `["friends", userId]` - Danh sách bạn bè của user khác
- `["friendRequests"]` - Friend requests
- `["blockedUsers"]` - Danh sách user bị block

---

## 7. Luồng Thông Báo (Notifications)

### 7.1. Lấy Thông Báo
- **Hook**: `useNotifications()`
- **Auto Refresh**: Mỗi 30 giây (`refetchInterval: 30000`)
- **Stale Time**: 10 giây

### 7.2. Đếm Thông Báo Chưa Đọc
- **Hook**: `useUnreadNotificationCount()`
- **Auto Refresh**: Mỗi 15 giây
- **Stale Time**: 5 giây

### 7.3. Đánh Dấu Đã Đọc
- **Single**: `markNotificationAsReadApi(notificationId)`
- **All**: `markAllNotificationsAsReadApi()`
- **Cache**: Invalidate notifications, unread-count

### 7.4. Xóa Thông Báo
- **API**: DELETE `/notifications/{notificationId}`
- **Cache**: Invalidate notifications, unread-count

### 7.5. Query Keys
- `["notifications"]` - Danh sách notifications
- `["notifications", "unread-count"]` - Số lượng chưa đọc

---

## 8. Luồng Comment (Bình Luận)

### 8.1. Tạo Comment
```
1. User nhập comment → Post Detail Screen
2. Gọi API POST /posts/{postId}/comments
3. Optimistic Update: 
   - Tăng commentCount trong post cache
   - Invalidate comments query
4. Nếu là reply: Invalidate commentReplies query
```

### 8.2. Xóa Comment
```
1. Gọi API DELETE /posts/{postId}/comments/{commentId}
2. Tính số lượng comments bị xóa (bao gồm replies)
3. Optimistic Update:
   - Giảm commentCount trong post cache
   - Invalidate comments và commentReplies queries
```

### 8.3. Lấy Replies
- **Hook**: `useCommentReplies(postId, commentId)`
- **Query Key**: `["commentReplies", postId, commentId]`

### 8.4. Cache Updates
- **Post Cache**: Tự động cập nhật `commentCount` khi create/delete
- **Feed Cache**: Cập nhật commentCount trong feed items

### 8.5. Query Keys
- `["comments", postId]` - Comments của post
- `["commentReplies", postId, commentId]` - Replies của comment

---

## 9. Luồng Reaction (Like/Unlike)

### 9.1. Toggle Reaction
```
1. User click like button
2. Haptic feedback (vibration)
3. Gọi API POST /posts/{postId}/reactions (toggle)
4. Optimistic Update:
   - Toggle hasReacted
   - Tăng/giảm reactionCount
5. Invalidate notifications
```

### 9.2. Cache Strategy
- **Optimistic Update**: Update ngay lập tức trong cache
- **Post Detail**: Update `["posts", postId]`
- **Feed**: Update tất cả feed queries
- **Không refetch**: Tránh làm mất posts đang hiển thị

### 9.3. Query Keys
- Sử dụng cùng keys với Post queries
- Tự động sync khi toggle reaction

---

## 10. Luồng Upload (Tải Lên File)

### 10.1. Upload Ảnh
```
1. User chọn ảnh → Image Picker
2. Tạo FormData với file URI
3. Gọi uploadImageApi(uri, folder?)
4. Timeout: 15s (default) hoặc 120s (video)
5. Nhận URL từ response
6. Sử dụng URL để tạo post/update avatar
```

### 10.2. Upload Video
- **Timeout**: 120 giây (cho video lớn)
- **Compression**: Có thể compress trước khi upload (videoCompressor.ts)
- **MIME Type**: Tự động detect và normalize

### 10.3. Upload Avatar
- **Endpoint**: `/upload/avatar`
- **Response**: URL của avatar
- **Usage**: Update user profile

### 10.4. Response Handling
- **Multiple Formats**: Xử lý các cấu trúc response khác nhau
  - `responseData.data.url`
  - `responseData.url`
  - `responseData.data.data.url`

### 10.5. Error Handling
- **Timeout**: Hiển thị lỗi timeout
- **Network**: Hiển thị lỗi mạng
- **Server Error**: Extract message từ response

---

## 11. Luồng Quản Lý State (State Management)

### 11.1. React Query (TanStack Query)
- **Chức năng**: Quản lý server state, caching, synchronization
- **Config**:
  - `retry: 2` - Retry 2 lần khi fail
  - `refetchOnWindowFocus: false` - Không refetch khi focus

### 11.2. Cache Strategy
- **Stale Time**: Khác nhau tùy loại data
  - Feed: 0 (luôn stale)
  - Notifications: 10s
  - Friends: 30s
- **Keep Previous Data**: Giữ data cũ khi load more (pagination)

### 11.3. Optimistic Updates
- **Post Create**: Thêm vào cache ngay
- **Post Delete**: Xóa khỏi cache ngay
- **Reaction**: Toggle state ngay
- **Comment**: Update count ngay

### 11.4. Query Invalidation
- **After Mutations**: Invalidate related queries
- **WebSocket Events**: Invalidate khi nhận real-time updates
- **Logout**: Clear toàn bộ cache

---

## 12. Luồng Xử Lý Lỗi (Error Handling)

### 12.1. API Errors
- **Interceptor**: Xử lý ở axios response interceptor
- **Types**: 
  - Network errors
  - Timeout errors
  - HTTP errors (401, 403, 404, 500)
- **User Messages**: Hiển thị message thân thiện bằng tiếng Việt

### 12.2. Component Error Handling
- **Try-Catch**: Bọc API calls trong try-catch
- **Error State**: Set error state để hiển thị trong UI
- **Toast**: Sử dụng Toast để hiển thị lỗi (thay vì Alert)

### 12.3. Error Boundary
- **Component**: `ErrorBoundary` wrapper ở root
- **Fallback**: Hiển thị error UI khi có lỗi không xử lý được

### 12.4. Error Utils
- **getErrorMessage()**: Extract message từ error object
- **handleApiError()**: Xử lý và log API errors
- **showErrorAlert()**: Hiển thị error (deprecated, dùng Toast)

---

## 13. Luồng Navigation (Điều Hướng)

### 13.1. File-based Routing (Expo Router)
- **Structure**: 
  - `app/` - Routes
  - `(tabs)/` - Tab navigation
  - `auth/` - Auth routes
  - `_layout.tsx` - Layout cho mỗi group

### 13.2. Protected Routes
- **Logic**: Kiểm tra trong `RootLayoutNav`
- **Redirect**: Tự động redirect dựa trên auth state

### 13.3. Deep Linking
- **Support**: Expo Router hỗ trợ deep linking
- **Params**: Sử dụng `useLocalSearchParams()` để lấy params

---

## 14. Luồng Tối Ưu Hóa (Performance)

### 14.1. Image Optimization
- **Compression**: Có thể compress ảnh trước khi upload
- **Lazy Loading**: React Native tự động lazy load images

### 14.2. Video Optimization
- **Compression**: Sử dụng `videoCompressor.ts` để compress video
- **Upload Timeout**: 120s cho video lớn

### 14.3. Cache Optimization
- **Stale Time**: Set phù hợp để giảm API calls
- **Keep Previous Data**: Giữ data khi pagination
- **Selective Invalidation**: Chỉ invalidate queries cần thiết

### 14.4. WebSocket Optimization
- **Single Connection**: Dùng singleton service
- **Reconnect Strategy**: Exponential backoff
- **Message Batching**: Có thể batch messages nếu cần

---

## 15. Tổng Kết Kiến Trúc

### 15.1. Layers
```
UI Components (Screens)
    ↓
Hooks (usePost, useMessage, etc.)
    ↓
API Services (post.api.ts, message.api.ts, etc.)
    ↓
API Wrapper (api.ts)
    ↓
Axios Instance (axios-instance.ts)
    ↓
Backend API
```

### 15.2. Data Flow
```
User Action
    ↓
Hook Mutation/Query
    ↓
API Service Call
    ↓
Axios Request (với interceptors)
    ↓
Backend Processing
    ↓
Response (với error handling)
    ↓
Cache Update (React Query)
    ↓
UI Re-render
```

### 15.3. Real-time Flow
```
Backend Event
    ↓
WebSocket Message
    ↓
WebSocketService Handler
    ↓
useWebSocket Hook
    ↓
React Query Cache Update
    ↓
UI Re-render
```

---

## 16. Best Practices Được Áp Dụng

1. **Separation of Concerns**: Tách biệt API, hooks, components
2. **Error Handling**: Xử lý lỗi ở nhiều tầng (interceptor, component)
3. **Optimistic Updates**: Cải thiện UX với immediate feedback
4. **Cache Management**: Quản lý cache hiệu quả với React Query
5. **Type Safety**: Sử dụng TypeScript cho type safety
6. **Code Reusability**: Tạo hooks và utils tái sử dụng
7. **Performance**: Optimize với stale time, keep previous data
8. **User Experience**: Toast notifications, haptic feedback, loading states

