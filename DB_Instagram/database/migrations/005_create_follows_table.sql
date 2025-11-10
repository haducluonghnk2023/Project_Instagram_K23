CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    target_user_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_follows_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_follows_target FOREIGN KEY (target_user_id) REFERENCES users(id),
    CONSTRAINT uq_follows UNIQUE (user_id, target_user_id)
);
CREATE INDEX IF NOT EXISTS idx_follows_user ON follows(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_target ON follows(target_user_id);


