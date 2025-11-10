-- Reactions unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS uq_post_reactions ON post_reactions(post_id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_comment_reactions ON comment_reactions(comment_id, user_id);

-- FK indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_posts_deleted_created ON posts(is_deleted, created_at);

-- Post media indexes
CREATE INDEX IF NOT EXISTS idx_post_media_post ON post_media(post_id);
CREATE INDEX IF NOT EXISTS idx_post_media_type ON post_media(media_type);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_deleted ON comments(post_id, is_deleted);

-- Messages indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_from_user ON messages(from_user);
CREATE INDEX IF NOT EXISTS idx_messages_to_user ON messages(to_user);
CREATE INDEX IF NOT EXISTS idx_messages_from_to ON messages(from_user, to_user);
CREATE INDEX IF NOT EXISTS idx_messages_to_read ON messages(to_user, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications(user_id, is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at);

-- Friends indexes
CREATE INDEX IF NOT EXISTS idx_friends_user_a ON friends(user_a);
CREATE INDEX IF NOT EXISTS idx_friends_user_b ON friends(user_b);
CREATE INDEX IF NOT EXISTS idx_friends_user_a_b ON friends(user_a, user_b);

-- Blocks indexes
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_blocked ON blocks(blocker, blocked);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);

-- Saved posts indexes
CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_post ON saved_posts(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_created ON saved_posts(created_at);


