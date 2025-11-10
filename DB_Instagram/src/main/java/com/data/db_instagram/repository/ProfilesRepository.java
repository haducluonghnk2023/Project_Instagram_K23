package com.data.db_instagram.repository;

import com.data.db_instagram.model.Profiles;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProfilesRepository extends JpaRepository<Profiles, UUID> {
    Optional<Profiles> findByUserId(UUID userId);
    boolean existsByUserId(UUID userId);
    // Batch load profiles để tránh N+1 query
    List<Profiles> findByUserIdIn(List<UUID> userIds);
}

