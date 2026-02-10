package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.User;
import com.ultron.backend.dto.request.SendInvitationRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.AuthResponse;
import com.ultron.backend.dto.response.InvitationResponse;
import com.ultron.backend.service.JwtService;
import com.ultron.backend.service.OrganizationInvitationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for managing organization invitations
 * Handles inviting users to join organizations
 */
@RestController
@RequestMapping("/invitations")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Invitations", description = "Organization user invitation management")
public class InvitationController {

    private final OrganizationInvitationService invitationService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    /**
     * Send invitation to user (Admin only)
     */
    @PostMapping("/send")
    @SecurityRequirement(name = "bearer-jwt")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Send invitation",
            description = "Invite a user to join the organization (admin only)"
    )
    public ResponseEntity<ApiResponse<InvitationResponse>> sendInvitation(
            @Valid @RequestBody SendInvitationRequest request) {

        log.info("Sending invitation to: {}", request.getEmail());

        InvitationResponse response = invitationService.sendInvitation(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<InvitationResponse>builder()
                        .success(true)
                        .message("Invitation sent successfully")
                        .data(response)
                        .build());
    }

    /**
     * Get all invitations for organization (Admin only)
     */
    @GetMapping
    @SecurityRequirement(name = "bearer-jwt")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get all invitations",
            description = "Retrieve all invitations for the organization (admin only)"
    )
    public ResponseEntity<ApiResponse<List<InvitationResponse>>> getOrganizationInvitations() {
        log.info("Fetching organization invitations");

        List<InvitationResponse> invitations = invitationService.getOrganizationInvitations();

        return ResponseEntity.ok(ApiResponse.<List<InvitationResponse>>builder()
                .success(true)
                .message("Invitations retrieved successfully")
                .data(invitations)
                .build());
    }

    /**
     * Get pending invitations (Admin only)
     */
    @GetMapping("/pending")
    @SecurityRequirement(name = "bearer-jwt")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get pending invitations",
            description = "Retrieve all pending invitations for the organization (admin only)"
    )
    public ResponseEntity<ApiResponse<List<InvitationResponse>>> getPendingInvitations() {
        log.info("Fetching pending invitations");

        List<InvitationResponse> invitations = invitationService.getPendingInvitations();

        return ResponseEntity.ok(ApiResponse.<List<InvitationResponse>>builder()
                .success(true)
                .message("Pending invitations retrieved successfully")
                .data(invitations)
                .build());
    }

    /**
     * Get invitation by ID (Public - for acceptance page)
     */
    @GetMapping("/{invitationId}")
    @Operation(
            summary = "Get invitation details",
            description = "Retrieve invitation details for acceptance (public endpoint)"
    )
    public ResponseEntity<ApiResponse<InvitationResponse>> getInvitation(
            @PathVariable String invitationId) {

        log.info("Fetching invitation: {}", invitationId);

        InvitationResponse invitation = invitationService.getInvitationById(invitationId);

        return ResponseEntity.ok(ApiResponse.<InvitationResponse>builder()
                .success(true)
                .message("Invitation retrieved successfully")
                .data(invitation)
                .build());
    }

    /**
     * Accept invitation and create account (Public)
     */
    @PostMapping("/{invitationId}/accept")
    @Operation(
            summary = "Accept invitation",
            description = "Accept invitation and create user account (public endpoint)"
    )
    public ResponseEntity<ApiResponse<AuthResponse>> acceptInvitation(
            @PathVariable String invitationId,
            @RequestBody AcceptInvitationRequest request) {

        log.info("Accepting invitation: {}", invitationId);

        // Encode password
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // Accept invitation and create user
        User user = invitationService.acceptInvitation(
                invitationId,
                encodedPassword,
                request.getFullName()
        );

        // Generate JWT token
        String token = jwtService.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                user.getTenantId()
        );

        // Build auth response
        AuthResponse authResponse = AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .token(token)
                .build();

        return ResponseEntity.ok(ApiResponse.<AuthResponse>builder()
                .success(true)
                .message("Invitation accepted successfully. You are now logged in.")
                .data(authResponse)
                .build());
    }

    /**
     * Revoke invitation (Admin only)
     */
    @DeleteMapping("/{invitationId}")
    @SecurityRequirement(name = "bearer-jwt")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Revoke invitation",
            description = "Revoke a pending invitation (admin only)"
    )
    public ResponseEntity<ApiResponse<Void>> revokeInvitation(
            @PathVariable String invitationId) {

        log.info("Revoking invitation: {}", invitationId);

        invitationService.revokeInvitation(invitationId);

        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Invitation revoked successfully")
                .build());
    }

    // Request DTO
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class AcceptInvitationRequest {
        private String fullName;
        private String password;
    }
}
