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
}

