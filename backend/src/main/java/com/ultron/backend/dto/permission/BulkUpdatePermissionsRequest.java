package com.ultron.backend.dto.permission;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for bulk updating user permissions
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkUpdatePermissionsRequest {

    @Valid
    private List<GrantPermissionRequest> grants;

    @Valid
    private List<RevokePermissionRequest> revokes;

    private String reason;
}
