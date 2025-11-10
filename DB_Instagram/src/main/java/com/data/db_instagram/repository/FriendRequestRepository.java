package com.data.db_instagram.repository;

import com.data.db_instagram.model.Friend_requests;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FriendRequestRepository extends JpaRepository<Friend_requests, UUID> {
    @Query("SELECT fr FROM Friend_requests fr WHERE fr.to_user = :toUser AND fr.status = :status")
    List<Friend_requests> findByToUserAndStatus(@Param("toUser") UUID toUser, @Param("status") String status);
    
    @Query("SELECT fr FROM Friend_requests fr WHERE fr.from_user = :fromUser AND fr.status = :status")
    List<Friend_requests> findByFromUserAndStatus(@Param("fromUser") UUID fromUser, @Param("status") String status);
    
    @Query("SELECT fr FROM Friend_requests fr WHERE fr.from_user = :fromUser AND fr.to_user = :toUser")
    Optional<Friend_requests> findByFromUserAndToUser(@Param("fromUser") UUID fromUser, @Param("toUser") UUID toUser);
    
    @Query("SELECT COUNT(fr) > 0 FROM Friend_requests fr WHERE fr.from_user = :fromUser AND fr.to_user = :toUser AND fr.status = :status")
    boolean existsByFromUserAndToUserAndStatus(@Param("fromUser") UUID fromUser, @Param("toUser") UUID toUser, @Param("status") String status);
    
    @Query("SELECT fr FROM Friend_requests fr WHERE fr.from_user = :fromUser AND fr.to_user = :toUser AND fr.status = :status")
    Optional<Friend_requests> findByFromUserAndToUserAndStatus(@Param("fromUser") UUID fromUser, @Param("toUser") UUID toUser, @Param("status") String status);
}

