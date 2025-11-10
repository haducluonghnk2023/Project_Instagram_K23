package com.data.db_instagram.repository;

import com.data.db_instagram.model.Message_media;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageMediaRepository extends JpaRepository<Message_media, UUID> {
    List<Message_media> findByMessage_id(UUID messageId);
    // Batch load media for multiple messages - optimized for performance
    @Query("SELECT mm FROM Message_media mm WHERE mm.message_id IN :messageIds ORDER BY mm.message_id ASC")
    List<Message_media> findByMessage_idIn(@Param("messageIds") List<UUID> messageIds);
    void deleteByMessage_id(UUID messageId);
}

