package com.data.db_instagram.repository;

import com.data.db_instagram.model.Blocks;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BlockRepository extends JpaRepository<Blocks, UUID> {
    List<Blocks> findByBlocker(UUID blocker);
    List<Blocks> findByBlocked(UUID blocked);
    Optional<Blocks> findByBlockerAndBlocked(UUID blocker, UUID blocked);
    boolean existsByBlockerAndBlocked(UUID blocker, UUID blocked);
}

