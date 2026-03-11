package com.ultron.backend.dto.permission;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for revoking permission from a user
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevokePermissionRequest {

    @NotBlank(message = "Object name is required")
    private String objectName;

    @NotBlank(message = "Action is required")
    private String action;

    private String reason;
}
