CREATE TABLE IF NOT EXISTS saved_posts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    post_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_saved_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_saved_post FOREIGN KEY (post_id) REFERENCES posts(id),
    CONSTRAINT uq_saved UNIQUE (user_id, post_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_post ON saved_posts(post_id);


