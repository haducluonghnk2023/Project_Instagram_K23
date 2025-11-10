package com.data.db_instagram.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlockUserRequest {
    @NotNull(message = "User ID is required")
    private UUID userId;
}

