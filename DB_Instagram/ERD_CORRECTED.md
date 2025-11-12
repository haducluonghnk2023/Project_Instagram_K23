# ERD Diagram - Database Schema Đã Chỉnh Sửa

## Mô tả ERD đầy đủ và chính xác

### Các Entity và Relationships

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ERD DIAGRAM - CORRECTED                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────┐
│  Users   │ (Central Entity)
└────┬─────┘
     │
     ├───(1)───┐
     │         │
     │    ┌────▼──────────┐
     │    │ AuthTokens    │ (1:N) - Một user có nhiều tokens
     │    └───────────────┘
     │
     ├───(1)───┐
     │         │
     │    ┌────▼──────────┐
     │    │  Profiles     │ (1:1) - Một user có một profile
     │    └───────────────┘
     │
     ├───(N)───┐
     │         │
     │    ┌────▼──────────┐
     │    │   Blocks      │ (N:N) - User có thể block nhiều user khác
     │    └────┬──────────┘
     │         │
     │         └───(N)───┐
     │                   │
     │              ┌─────▼──────┐
     │              │   Users    │ (blocked user)
     │              └────────────┘
     │
     ├───(N)───┐
     │         │
     │    ┌────▼──────────┐
     │    │   Friends     │ (N:N) - Many-to-Many qua junction table
     │    └────┬──────────┘
     │         │
     │         └───(N)───┐
     │                   │
     │              ┌─────▼──────┐
     │              │   Users    │ (user_b)
     │              └────────────┘
     │
     ├───(N)───┐
     │         │
     │    ┌────▼──────────────┐
     │    │ Friend_requests  │ (N:N) - Many-to-Many qua junction table
     │    └────┬──────────────┘
     │         │
     │         └───(N)───┐
     │                   │
     │              ┌─────▼──────┐
     │              │   Users    │ (to_user)
     │              └────────────┘
     │
     ├───(N)───┐
     │         │
     │    ┌────▼──────────┐
     │    │   Follows     │ (N:N) - Many-to-Many qua junction table
     │    └────┬──────────┘
     │         │
     │         └───(N)───┐
     │                   │
     │              ┌─────▼──────┐
     │              │   Users    │ (target_user_id)
     │              └────────────┘
     │
     ├───(N)───┐
     │         │
     │    ┌────▼──────────────┐
     │    │ Follow_requests   │ (N:N) - Many-to-Many qua junction table
     │    └────┬───────────────┘
     │         │
     │         └───(N)───┐
     │                   │
     │              ┌─────▼──────┐
     │              │   Users    │ (to_user)
     │              └────────────┘
     │
     ├───(N)───┐
     │         │
     │    ┌────▼──────────┐
     │    │    Posts      │ (1:N) - Một user có nhiều posts
     │    └────┬──────────┘
     │         │
     │         ├───(N)───┐
     │         │         │
     │         │    ┌────▼──────────┐
     │         │    │ Post_media    │ (1:N) - Một post có nhiều media
     │         │    └───────────────┘
     │         │
     │         ├───(N)───┐
     │         │         │
     │         │    ┌────▼──────────────┐
     │         │    │ Post_reactions    │ (N:N) - Many-to-Many qua junction
     │         │    └────┬──────────────┘
     │         │         │
     │         │         └───(N)───┐
     │         │                   │
     │         │              ┌─────▼──────┐
     │         │              │   Users    │
     │         │              └────────────┘
     │         │
     │         ├───(N)───┐
     │         │         │
     │         │    ┌────▼──────────┐
     │         │    │  Comments     │ (1:N) - Một post có nhiều comments
     │         │    └────┬──────────┘
     │         │         │
     │         │         ├───(N)───┐ (self-referencing)
     │         │         │         │
     │         │         │    ┌────▼──────────┐
     │         │         │    │  Comments    │ (parent_comment)
     │         │         │    └──────────────┘
     │         │         │
     │         │         ├───(1)───┐
     │         │         │         │
     │         │         │    ┌────▼──────────┐
     │         │         │    │   Users       │ (1:N) - Một user có nhiều comments
     │         │         │    └───────────────┘
     │         │         │
     │         │         ├───(N)───┐
     │         │         │         │
     │         │         │    ┌────▼──────────────┐
     │         │         │    │ Comment_reactions │ (N:N)
     │         │         │    └────┬───────────────┘
     │         │         │         │
     │         │         │         └───(N)───┐
     │         │         │                   │
     │         │         │              ┌─────▼──────┐
     │         │         │              │   Users    │
     │         │         │              └────────────┘
     │         │         │
     │         │         └───(N)───┐
     │         │                   │
     │         │              ┌────▼──────────┐
     │         │              │ Comment_tags  │ (N:N)
     │         │              └────┬───────────┘
     │         │                   │
     │         │                   └───(N)───┐
     │         │                             │
     │         │                        ┌─────▼──────┐
     │         │                        │   Users    │ (tagged_user)
     │         │                        └────────────┘
     │         │
     │         └───(N)───┐
     │                   │
     │              ┌────▼──────────┐
     │              │ Saved_posts   │ (N:N) - Many-to-Many qua junction
     │              └────┬──────────┘
     │                   │
     │                   └───(N)───┐
     │                             │
     │                        ┌─────▼──────┐
     │                        │   Users    │
     │                        └────────────┘
     │
     ├───(N)───┐ (from_user)
     │         │
     │    ┌────▼──────────┐
     │    │   Messages    │ (1:N) - Một user gửi nhiều messages
     │    └────┬──────────┘
     │         │
     │         ├───(1)───┐ (to_user)
     │         │         │
     │         │    ┌────▼──────────┐
     │         │    │   Users       │ (1:N) - Một user nhận nhiều messages
     │         │    └───────────────┘
     │         │
     │         ├───(N)───┐
     │         │         │
     │         │    ┌────▼──────────┐
     │         │    │ Message_media │ (1:N) - Một message có nhiều media
     │         │    └───────────────┘
     │         │
     │         └───(N)───┐
     │                   │
     │              ┌────▼──────────────┐
     │              │ Message_reactions │ (N:N)
     │              └────┬──────────────┘
     │                   │
     │                   └───(N)───┐
     │                             │
     │                        ┌─────▼──────┐
     │                        │   Users    │
     │                        └────────────┘
     │
     └───(N)───┐ (user_id - người nhận)
               │
          ┌────▼──────────┐
          │ Notifications │ (1:N) - Một user nhận nhiều notifications
          └────┬──────────┘
               │
               └───(1)───┐ (actor_id - người gây ra)
                         │
                    ┌────▼──────────┐
                    │   Users       │ (1:N) - Một user có thể là actor của nhiều notifications
                    └───────────────┘
```

## Chi tiết các Relationships

### 1. Users → AuthTokens (1:N)
- Một user có thể có nhiều authentication tokens
- Foreign Key: `auth_tokens.user_id → users.id`

### 2. Users → Profiles (1:1)
- Một user có đúng một profile
- Foreign Key: `profiles.user_id → users.id` (UNIQUE)

### 3. Users → Blocks (N:N)
- Một user có thể block nhiều user khác
- Junction table: `blocks` với `blocker` và `blocked`
- Foreign Keys: `blocks.blocker → users.id`, `blocks.blocked → users.id`

### 4. Users → Friends (N:N)
- Many-to-Many relationship
- Junction table: `friends` với `user_a` và `user_b`
- Foreign Keys: `friends.user_a → users.id`, `friends.user_b → users.id`

### 5. Users → Friend_requests (N:N)
- Many-to-Many relationship
- Junction table: `friend_requests` với `from_user` và `to_user`
- Foreign Keys: `friend_requests.from_user → users.id`, `friend_requests.to_user → users.id`

### 6. Users → Follows (N:N) ⭐ MỚI
- Many-to-Many relationship
- Junction table: `follows` với `user_id` và `target_user_id`
- Foreign Keys: `follows.user_id → users.id`, `follows.target_user_id → users.id`

### 7. Users → Follow_requests (N:N) ⭐ MỚI
- Many-to-Many relationship
- Junction table: `follow_requests` với `from_user` và `to_user`
- Foreign Keys: `follow_requests.from_user → users.id`, `follow_requests.to_user → users.id`

### 8. Users → Posts (1:N) ⭐ THIẾU TRONG ERD CŨ
- Một user có thể tạo nhiều posts
- Foreign Key: `posts.user_id → users.id`

### 9. Posts → Post_media (1:N)
- Một post có thể có nhiều media items
- Foreign Key: `post_media.post_id → posts.id`

### 10. Posts → Post_reactions (1:N) → Users (N:1) (N:N)
- Many-to-Many relationship qua junction table
- Junction table: `post_reactions` với `post_id` và `user_id`
- Foreign Keys: `post_reactions.post_id → posts.id`, `post_reactions.user_id → users.id`

### 11. Posts → Comments (1:N) ⭐ THIẾU TRONG ERD CŨ
- Một post có thể có nhiều comments
- Foreign Key: `comments.post_id → posts.id`

### 12. Comments → Comments (1:N) ⭐ THIẾU TRONG ERD CŨ
- Self-referencing relationship cho nested comments
- Foreign Key: `comments.parent_comment_id → comments.id`

### 13. Users → Comments (1:N) ⭐ THIẾU TRONG ERD CŨ
- Một user có thể tạo nhiều comments
- Foreign Key: `comments.user_id → users.id`

### 14. Comments → Comment_reactions (1:N) → Users (N:1) (N:N)
- Many-to-Many relationship qua junction table
- Junction table: `comment_reactions` với `comment_id` và `user_id`
- Foreign Keys: `comment_reactions.comment_id → comments.id`, `comment_reactions.user_id → users.id`

### 15. Comments → Comment_tags (1:N) → Users (N:1) (N:N)
- Many-to-Many relationship qua junction table
- Junction table: `comment_tags` với `comment_id` và `tagged_user_id`
- Foreign Keys: `comment_tags.comment_id → comments.id`, `comment_tags.tagged_user_id → users.id`

### 16. Posts → Saved_posts (1:N) → Users (N:1) (N:N)
- Many-to-Many relationship qua junction table
- Junction table: `saved_posts` với `post_id` và `user_id`
- Foreign Keys: `saved_posts.post_id → posts.id`, `saved_posts.user_id → users.id`

### 17. Users → Messages (1:N) as from_user ⭐ THIẾU TRONG ERD CŨ
- Một user có thể gửi nhiều messages
- Foreign Key: `messages.from_user → users.id`

### 18. Users → Messages (1:N) as to_user ⭐ THIẾU TRONG ERD CŨ
- Một user có thể nhận nhiều messages
- Foreign Key: `messages.to_user → users.id`

### 19. Messages → Message_media (1:N)
- Một message có thể có nhiều media items
- Foreign Key: `message_media.message_id → messages.id`

### 20. Messages → Message_reactions (1:N) → Users (N:1) (N:N)
- Many-to-Many relationship qua junction table
- Junction table: `message_reactions` với `message_id` và `user_id`
- Foreign Keys: `message_reactions.message_id → messages.id`, `message_reactions.user_id → users.id`

### 21. Users → Notifications (1:N) as user_id ⭐ THIẾU TRONG ERD CŨ
- Một user có thể nhận nhiều notifications
- Foreign Key: `notifications.user_id → users.id`

### 22. Users → Notifications (1:N) as actor_id ⭐ THIẾU TRONG ERD CŨ
- Một user có thể là actor của nhiều notifications
- Foreign Key: `notifications.actor_id → users.id`

## Tóm tắt các vấn đề đã sửa

### ✅ Đã thêm vào ERD:
1. **Posts ← Users** relationship
2. **Comments ← Posts** relationship
3. **Comments ← Comments** (self-referencing) relationship
4. **Comments ← Users** relationship
5. **Messages ← Users** (from_user) relationship
6. **Messages ← Users** (to_user) relationship
7. **Notifications ← Users** (actor_id) relationship
8. **Follows** entity và relationships
9. **Follow_requests** entity và relationships

### ✅ Đã sửa:
1. **Blocks** relationship - làm rõ là N:N với 2 vai trò (blocker và blocked)

## Danh sách đầy đủ các Entity

1. **Users** (Central Entity)
2. **AuthTokens**
3. **Profiles**
4. **Blocks**
5. **Friends**
6. **Friend_requests**
7. **Follows** ⭐
8. **Follow_requests** ⭐
9. **Posts**
10. **Post_media**
11. **Post_reactions**
12. **Comments**
13. **Comment_reactions**
14. **Comment_tags**
15. **Saved_posts**
16. **Messages**
17. **Message_media**
18. **Message_reactions**
19. **Notifications**

⭐ = Entity/Relationship mới được thêm vào so với ERD cũ

