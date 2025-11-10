-- Migration: Create friend_requests table
-- Description: Friend request management

CREATE TABLE IF NOT EXISTS friend_requests (
    id CHAR(36) PRIMARY KEY,
    from_user CHAR(36) NOT NULL,
    to_user CHAR(36) NOT NULL,
    message TEXT,
    status VARCHAR(16) DEFAULT 'pending' COMMENT 'pending, accepted, rejected, cancelled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (from_user) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_friend_requests_pair (from_user, to_user),
    INDEX idx_friend_requests_from_user (from_user),
    INDEX idx_friend_requests_to_user (to_user),
    INDEX idx_friend_requests_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

