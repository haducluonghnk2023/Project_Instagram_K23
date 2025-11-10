package com.data.db_instagram.repository;

import com.data.db_instagram.model.Message_reactions;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessageReactionsRepository extends JpaRepository<Message_reactions, UUID> {
    @Query("SELECT mr FROM Message_reactions mr WHERE mr.message_id = :messageId ORDER BY mr.created_at DESC")
    List<Message_reactions> findByMessage_idOrderByCreated_atDesc(@Param("messageId") UUID messageId);
    
    @Query("SELECT mr FROM Message_reactions mr WHERE mr.message_id = :messageId AND mr.user_id = :userId")
    Optional<Message_reactions> findByMessageIdAndUserId(@Param("messageId") UUID messageId, @Param("userId") UUID userId);
    
    @Query("SELECT COUNT(mr) > 0 FROM Message_reactions mr WHERE mr.message_id = :messageId AND mr.user_id = :userId")
    boolean existsByMessageIdAndUserId(@Param("messageId") UUID messageId, @Param("userId") UUID userId);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM Message_reactions mr WHERE mr.message_id = :messageId")
    void deleteByMessage_id(@Param("messageId") UUID messageId);
    
    // Batch load reactions for multiple messages - optimized for performance
    @Query("SELECT mr FROM Message_reactions mr WHERE mr.message_id IN :messageIds ORDER BY mr.message_id ASC, mr.created_at DESC")
    List<Message_reactions> findByMessage_idIn(@Param("messageIds") List<UUID> messageIds);
}

