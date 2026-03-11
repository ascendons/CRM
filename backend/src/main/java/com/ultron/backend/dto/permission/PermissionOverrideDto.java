package com.ultron.backend.dto.permission;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for user-specific permission overrides
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionOverrideDto {

    private String objectName;
    private String action;
    private Boolean granted;  // true = grant, false = explicit deny

    // Audit fields
    private String grantedBy;
    private String grantedByName;
    private LocalDateTime grantedAt;
    private String reason;
    private LocalDateTime expiresAt;
}
