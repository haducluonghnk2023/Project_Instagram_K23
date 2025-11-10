package com.data.db_instagram.repository;

import com.data.db_instagram.model.Messages;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessagesRepository extends JpaRepository<Messages, UUID> {
    
    // Tìm tất cả tin nhắn giữa 2 user
    @Query("SELECT m FROM Messages m WHERE " +
           "(m.from_user = :user1 AND m.to_user = :user2) OR " +
           "(m.from_user = :user2 AND m.to_user = :user1) " +
           "ORDER BY m.created_at ASC")
    List<Messages> findConversationBetweenUsers(@Param("user1") UUID user1, @Param("user2") UUID user2);
    
    // Tìm tin nhắn chưa đọc của user
    @Query("SELECT m FROM Messages m WHERE m.to_user = :userId AND m.is_read = false " +
           "ORDER BY m.created_at DESC")
    List<Messages> findUnreadMessagesByUserId(@Param("userId") UUID userId);
    
    // Đếm tin nhắn chưa đọc với một user cụ thể
    @Query("SELECT COUNT(m) FROM Messages m WHERE " +
           "m.to_user = :userId AND m.from_user = :fromUserId AND m.is_read = false")
    long countUnreadMessages(@Param("userId") UUID userId, @Param("fromUserId") UUID fromUserId);
    
    // Lấy danh sách user đã nhắn tin với current user (conversations)
    // Tối ưu: chỉ lấy message cuối cùng của mỗi conversation
    @Query("SELECT m FROM Messages m WHERE m.id IN (" +
           "SELECT MAX(m2.id) FROM Messages m2 " +
           "WHERE m2.from_user = :userId OR m2.to_user = :userId " +
           "GROUP BY CASE WHEN m2.from_user = :userId THEN m2.to_user ELSE m2.from_user END" +
           ") ORDER BY m.created_at DESC")
    List<Messages> findLastMessagesByUserId(@Param("userId") UUID userId);
    
    // Lấy tất cả messages liên quan đến user (cho backward compatibility - không nên dùng)
    @Query("SELECT m FROM Messages m WHERE m.from_user = :userId OR m.to_user = :userId " +
           "ORDER BY m.created_at DESC")
    List<Messages> findAllMessagesByUserId(@Param("userId") UUID userId);
}

