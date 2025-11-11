package com.data.db_instagram.repository;

import com.data.db_instagram.model.Notifications;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationsRepository extends JpaRepository<Notifications, UUID> {
    
    // Tìm tất cả notifications của user, sắp xếp theo thời gian mới nhất
    @Query("SELECT n FROM Notifications n WHERE n.user_id = :userId " +
           "ORDER BY n.created_at DESC")
    List<Notifications> findByUserIdOrderByCreatedAtDesc(@Param("userId") UUID userId);
    
    // Đếm số notifications chưa đọc
    @Query("SELECT COUNT(n) FROM Notifications n WHERE n.user_id = :userId AND n.is_read = false")
    long countUnreadNotifications(@Param("userId") UUID userId);
    
    // Tìm notifications chưa đọc
    @Query("SELECT n FROM Notifications n WHERE n.user_id = :userId AND n.is_read = false " +
           "ORDER BY n.created_at DESC")
    List<Notifications> findUnreadNotificationsByUserId(@Param("userId") UUID userId);
    
    // Tìm notification theo type và actor
    @Query("SELECT n FROM Notifications n WHERE n.user_id = :userId AND n.type = :type AND n.actor_id = :actorId " +
           "ORDER BY n.created_at DESC")
    List<Notifications> findByUserIdAndTypeAndActorId(
            @Param("userId") UUID userId,
            @Param("type") String type,
            @Param("actorId") UUID actorId
    );
    
    // Kiểm tra xem đã có notification chưa đọc trong khoảng thời gian gần đây
    @Query("SELECT COUNT(n) > 0 FROM Notifications n WHERE n.user_id = :userId " +
           "AND n.type = :type AND n.actor_id = :actorId " +
           "AND n.payload LIKE :payloadPattern " +
           "AND n.is_read = false " +
           "AND n.created_at >= :sinceTime")
    boolean existsUnreadNotificationRecently(
            @Param("userId") UUID userId,
            @Param("actorId") UUID actorId,
            @Param("type") String type,
            @Param("payloadPattern") String payloadPattern,
            @Param("sinceTime") java.util.Date sinceTime
    );
    
    // Tìm notification chưa đọc theo userId, type, actorId và payload pattern
    @Query("SELECT n FROM Notifications n WHERE n.user_id = :userId " +
           "AND n.type = :type AND n.actor_id = :actorId " +
           "AND n.payload LIKE :payloadPattern " +
           "AND n.is_read = false " +
           "ORDER BY n.created_at DESC")
    List<Notifications> findUnreadByUserIdAndTypeAndActorIdAndPayloadLike(
            @Param("userId") UUID userId,
            @Param("actorId") UUID actorId,
            @Param("type") String type,
            @Param("payloadPattern") String payloadPattern
    );
    
    // Kiểm tra xem đã có notification chưa đọc (không giới hạn thời gian)
    @Query("SELECT COUNT(n) > 0 FROM Notifications n WHERE n.user_id = :userId " +
           "AND n.type = :type AND n.actor_id = :actorId " +
           "AND n.payload LIKE :payloadPattern " +
           "AND n.is_read = false")
    boolean existsUnreadNotification(
            @Param("userId") UUID userId,
            @Param("actorId") UUID actorId,
            @Param("type") String type,
            @Param("payloadPattern") String payloadPattern
    );
}

