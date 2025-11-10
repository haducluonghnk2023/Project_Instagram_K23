CREATE TABLE IF NOT EXISTS follow_requests (
    id UUID PRIMARY KEY,
    from_user UUID NOT NULL,
    to_user UUID NOT NULL,
    status VARCHAR(16) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_follow_req_from FOREIGN KEY (from_user) REFERENCES users(id),
    CONSTRAINT fk_follow_req_to FOREIGN KEY (to_user) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_follow_req_to ON follow_requests(to_user);
CREATE INDEX IF NOT EXISTS idx_follow_req_from ON follow_requests(from_user);


