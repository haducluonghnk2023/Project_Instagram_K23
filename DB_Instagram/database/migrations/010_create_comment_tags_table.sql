-- Create comment_tags table to store tagged users in comments
CREATE TABLE IF NOT EXISTS comment_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    tagged_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comment_id, tagged_user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_comment_tags_comment_id ON comment_tags(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_tags_tagged_user_id ON comment_tags(tagged_user_id);

