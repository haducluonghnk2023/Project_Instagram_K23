package com.data.db_instagram.repository;

import com.data.db_instagram.model.Friends;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FriendRepository extends JpaRepository<Friends, UUID> {
    @Query("SELECT f FROM Friends f WHERE f.user_a = :userId OR f.user_b = :userId")
    List<Friends> findByUserAOrUserB(@Param("userId") UUID userId);
    
    @Query("SELECT f FROM Friends f WHERE (f.user_a = :userA AND f.user_b = :userB) OR (f.user_a = :userB AND f.user_b = :userA)")
    Optional<Friends> findByUserAAndUserB(@Param("userA") UUID userA, @Param("userB") UUID userB);
    
    @Query("SELECT f FROM Friends f WHERE f.user_a = :userA AND f.user_b = :userB")
    Optional<Friends> findByUserAAndUserBOrdered(@Param("userA") UUID userA, @Param("userB") UUID userB);
    
    @Query("SELECT f FROM Friends f WHERE f.user_a = :userB AND f.user_b = :userA")
    Optional<Friends> findByUserBAndUserA(@Param("userA") UUID userA, @Param("userB") UUID userB);
    
    @Query("SELECT COUNT(f) > 0 FROM Friends f WHERE (f.user_a = :userA AND f.user_b = :userB) OR (f.user_a = :userB AND f.user_b = :userA)")
    boolean existsByUserAAndUserB(@Param("userA") UUID userA, @Param("userB") UUID userB);
}

