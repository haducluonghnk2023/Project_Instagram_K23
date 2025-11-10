package com.data.db_instagram.repository;

import com.data.db_instagram.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IUserRepository extends JpaRepository<Users, UUID> {
    Optional<Users> findByEmail(String email);
    Optional<Users> findByPhone(String phone);
    Optional<Users> findByEmailOrPhone(String email, String phone);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    List<Users> findByPhoneContaining(String phone);
    List<Users> findByEmailContaining(String email);
    List<Users> findByEmailContainingOrPhoneContaining(String email, String phone);
}

