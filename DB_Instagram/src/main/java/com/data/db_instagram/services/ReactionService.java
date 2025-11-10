package com.data.db_instagram.services;

import java.util.UUID;

public interface ReactionService {
    void toggleReaction(UUID userId, UUID postId);
    boolean hasReacted(UUID userId, UUID postId);
}

