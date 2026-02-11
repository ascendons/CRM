package com.ultron.backend.controller;

import com.ultron.backend.dto.request.UpdateLeadAssignmentConfigRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.LeadAssignmentConfigResponse;
import com.ultron.backend.service.LeadAssignmentConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Admin API for managing lead auto-assignment configuration
 */
@Slf4j
@RestController
@RequestMapping("/lead-assignment-config")
@RequiredArgsConstructor
public class LeadAssignmentConfigController {

    private final LeadAssignmentConfigService configService;

    /**
     * Get current lead assignment configuration
     */
    @GetMapping
    @PreAuthorize("hasPermission('LEAD', 'READ')")
    public ResponseEntity<ApiResponse<LeadAssignmentConfigResponse>> getConfiguration() {
        log.info("Fetching lead assignment configuration");

        LeadAssignmentConfigResponse config = configService.getConfiguration();

        return ResponseEntity.ok(ApiResponse.success(
                "Configuration retrieved successfully",
                config
        ));
    }

    /**
     * Update lead assignment configuration
     * Only admins can update configuration
     */
    @PutMapping
    @PreAuthorize("hasPermission('LEAD', 'EDIT')")
    public ResponseEntity<ApiResponse<LeadAssignmentConfigResponse>> updateConfiguration(
            @Valid @RequestBody UpdateLeadAssignmentConfigRequest request,
            Authentication authentication) {

        String currentUserId = authentication.getName();
        log.info("Updating lead assignment configuration by user: {}", currentUserId);

        LeadAssignmentConfigResponse config = configService.updateConfiguration(
                request,
                currentUserId
        );

        return ResponseEntity.ok(ApiResponse.success(
                "Configuration updated successfully",
                config
        ));
    }
}
