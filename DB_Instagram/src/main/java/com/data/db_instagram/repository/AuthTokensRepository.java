package com.data.db_instagram.repository;

import com.data.db_instagram.model.Auth_tokens;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AuthTokensRepository extends JpaRepository<Auth_tokens, UUID> {
    // Tìm token theo token string
    Optional<Auth_tokens> findByToken(String token);
    
    // Tìm token theo user_id và token
    Optional<Auth_tokens> findByUser_idAndToken(UUID userId, String token);
    
    // Tìm tất cả token của user (chưa bị revoke)
    @Query("SELECT a FROM Auth_tokens a WHERE a.user_id = :userId AND a.revoked = false")
    java.util.List<Auth_tokens> findActiveTokensByUserId(@Param("userId") UUID userId);
    
    // Đánh dấu token là revoked
    @Modifying
    @Query("UPDATE Auth_tokens a SET a.revoked = true WHERE a.token = :token")
    void revokeToken(@Param("token") String token);
    
    // Đánh dấu tất cả token của user là revoked
    @Modifying
    @Query("UPDATE Auth_tokens a SET a.revoked = true WHERE a.user_id = :userId AND a.revoked = false")
    void revokeAllUserTokens(@Param("userId") UUID userId);
    
    // Xóa token đã hết hạn
    @Modifying
    @Query("DELETE FROM Auth_tokens a WHERE a.expires_at < :now")
    void deleteExpiredTokens(@Param("now") Date now);
    
    // Kiểm tra token có hợp lệ không (chưa hết hạn và chưa bị revoke)
    @Query("SELECT COUNT(a) > 0 FROM Auth_tokens a WHERE a.token = :token AND a.revoked = false AND a.expires_at > :now")
    boolean isTokenValid(@Param("token") String token, @Param("now") Date now);
}

