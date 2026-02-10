package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Organization;
import com.ultron.backend.domain.entity.OrganizationInvitation;
import com.ultron.backend.domain.entity.User;
import com.ultron.backend.domain.enums.UserRole;
import com.ultron.backend.domain.enums.UserStatus;
import com.ultron.backend.dto.request.SendInvitationRequest;
import com.ultron.backend.dto.response.InvitationResponse;
import com.ultron.backend.exception.BusinessException;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.OrganizationInvitationRepository;
import com.ultron.backend.repository.OrganizationRepository;
import com.ultron.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing organization invitations
 * Handles inviting users to join organizations (tenants)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationInvitationService extends BaseTenantService {

    private final OrganizationInvitationRepository invitationRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final OrganizationService organizationService;
    private final EmailNotificationService emailNotificationService;

    /**
     * Send invitation to user to join organization
     */
    @Transactional
    public InvitationResponse sendInvitation(SendInvitationRequest request) {
        String tenantId = getCurrentTenantId();
        String currentUserId = getCurrentUserId();

        log.info("[Tenant: {}] Sending invitation to: {}", tenantId, request.getEmail());

        // 1. Validate organization exists and is active
        Organization organization = organizationRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        if (organization.getStatus() != Organization.OrganizationStatus.ACTIVE) {
            throw new BusinessException("Cannot send invitations - organization is not active");
        }

        // 2. Check if user already exists in organization
        // TODO: Add method to UserRepository
        // if (userRepository.existsByEmailAndTenantIdAndIsDeletedFalse(request.getEmail(), tenantId)) {
        //     throw new BusinessException("User already exists in this organization");
        // }

        // 3. Check if pending invitation already exists
        if (invitationRepository.existsByEmailAndTenantIdAndStatusAndIsDeletedFalse(
                request.getEmail(), tenantId, OrganizationInvitation.InvitationStatus.PENDING)) {
            throw new BusinessException("Pending invitation already exists for this email");
        }

        // 4. Validate user limits
        // TODO: Implement usage limit validation
        // organizationService.validateResourceLimit("USER", tenantId);

        // 5. Get inviter details
        User inviter = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Inviter not found"));

        // 6. Create invitation
        String invitationId = generateInvitationId();

        OrganizationInvitation invitation = OrganizationInvitation.builder()
                .invitationId(invitationId)
                .tenantId(tenantId)
                .email(request.getEmail().toLowerCase())
                .invitedByUserId(currentUserId)
                .invitedByName(inviter.getFullName())
                .roleId(request.getRoleId())
                .roleName(request.getRoleName())
                .profileId(request.getProfileId())
                .profileName(request.getProfileName())
                .personalMessage(request.getPersonalMessage())
                .status(OrganizationInvitation.InvitationStatus.PENDING)
                .sentAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusDays(7))  // 7 days expiry
                .createdAt(LocalDateTime.now())
                .createdBy(currentUserId)
                .isDeleted(false)
                .build();

        OrganizationInvitation saved = invitationRepository.save(invitation);

        // 7. Send email notification
        try {
            emailNotificationService.sendInvitationEmail(
                    request.getEmail(),
                    organization.getOrganizationName(),
                    inviter.getFullName(),
                    invitationId,
                    request.getPersonalMessage()
            );
        } catch (Exception e) {
            log.error("Failed to send invitation email", e);
            // Don't fail the invitation if email fails
        }

        log.info("[Tenant: {}] Invitation sent successfully: {}", tenantId, invitationId);

        return mapToResponse(saved, organization);
    }

    /**
     * Accept invitation and create user account
     */
    @Transactional
    public User acceptInvitation(String invitationId, String password, String fullName) {
        log.info("Accepting invitation: {}", invitationId);

        // 1. Find invitation
        OrganizationInvitation invitation = invitationRepository
                .findByInvitationIdAndIsDeletedFalse(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found"));

        // 2. Validate invitation
        if (invitation.getStatus() != OrganizationInvitation.InvitationStatus.PENDING) {
            throw new BusinessException("Invitation is no longer valid (status: " +
                    invitation.getStatus() + ")");
        }

        if (invitation.isExpired()) {
            invitation.setStatus(OrganizationInvitation.InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
            throw new BusinessException("Invitation has expired");
        }

        // 3. Check if user already exists
        // TODO: Add method to UserRepository
        // if (userRepository.existsByEmailAndTenantIdAndIsDeletedFalse(
        //         invitation.getEmail(), invitation.getTenantId())) {
        //     throw new BusinessException("User already exists in this organization");
        // }

        // 4. Create user account
        String userId = generateUserId();

        // Parse name
        String[] nameParts = fullName.trim().split(" ", 2);
        String firstName = nameParts[0];
        String lastName = nameParts.length > 1 ? nameParts[1] : "";

        User.UserProfile profile = User.UserProfile.builder()
                .firstName(firstName)
                .lastName(lastName)
                .fullName(fullName)
                .build();

        User.UserSettings settings = User.UserSettings.builder()
                .timeZone("Asia/Kolkata")
                .language("en")
                .dateFormat("DD/MM/YYYY")
                .currency("INR")
                .emailNotifications(true)
                .desktopNotifications(true)
                .build();

        User.UserSecurity security = User.UserSecurity.builder()
                .twoFactorEnabled(false)
                .failedLoginAttempts(0)
                .build();

        User user = User.builder()
                .userId(userId)
                .tenantId(invitation.getTenantId())
                .username(invitation.getEmail().split("@")[0])
                .email(invitation.getEmail())
                .password(password)  // Should be encoded by service
                .fullName(fullName)
                .profile(profile)
                .settings(settings)
                .security(security)
                .roleId(invitation.getRoleId())
                .roleName(invitation.getRoleName())
                .profileId(invitation.getProfileId())
                .profileName(invitation.getProfileName())
                .role(UserRole.USER)  // Default role
                .status(UserStatus.ACTIVE)
                .passwordLastChanged(LocalDateTime.now())
                .passwordExpiresAt(LocalDateTime.now().plusDays(90))
                .createdAt(LocalDateTime.now())
                .createdBy("INVITATION")
                .isDeleted(false)
                .build();

        User savedUser = userRepository.save(user);

        // 5. Update invitation status
        invitation.setStatus(OrganizationInvitation.InvitationStatus.ACCEPTED);
        invitation.setAcceptedAt(LocalDateTime.now());
        invitation.setAcceptedByUserId(savedUser.getId());
        invitation.setLastModifiedAt(LocalDateTime.now());
        invitationRepository.save(invitation);

        // 6. Increment organization user count
        // TODO: Implement usage increment
        // organizationService.incrementUsage("USER", invitation.getTenantId());

        log.info("Invitation accepted successfully: {} -> User: {}", invitationId, userId);

        return savedUser;
    }

    /**
     * Revoke pending invitation
     */
    @Transactional
    public void revokeInvitation(String invitationId) {
        String tenantId = getCurrentTenantId();
        String currentUserId = getCurrentUserId();

        OrganizationInvitation invitation = invitationRepository
                .findByInvitationIdAndIsDeletedFalse(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found"));

        // Validate tenant ownership
        validateResourceTenantOwnership(invitation.getTenantId());

        if (invitation.getStatus() != OrganizationInvitation.InvitationStatus.PENDING) {
            throw new BusinessException("Can only revoke pending invitations");
        }

        invitation.setStatus(OrganizationInvitation.InvitationStatus.REVOKED);
        invitation.setRevokedAt(LocalDateTime.now());
        invitation.setRevokedByUserId(currentUserId);
        invitation.setLastModifiedAt(LocalDateTime.now());

        invitationRepository.save(invitation);

        log.info("[Tenant: {}] Invitation revoked: {}", tenantId, invitationId);
    }

    /**
     * Get all invitations for current organization
     */
    public List<InvitationResponse> getOrganizationInvitations() {
        String tenantId = getCurrentTenantId();

        Organization organization = organizationRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        List<OrganizationInvitation> invitations = invitationRepository
                .findByTenantIdAndIsDeletedFalse(tenantId);

        return invitations.stream()
                .map(inv -> mapToResponse(inv, organization))
                .collect(Collectors.toList());
    }

    /**
     * Get pending invitations for current organization
     */
    public List<InvitationResponse> getPendingInvitations() {
        String tenantId = getCurrentTenantId();

        Organization organization = organizationRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        List<OrganizationInvitation> invitations = invitationRepository
                .findByTenantIdAndStatusAndIsDeletedFalse(
                        tenantId, OrganizationInvitation.InvitationStatus.PENDING);

        return invitations.stream()
                .filter(inv -> !inv.isExpired())
                .map(inv -> mapToResponse(inv, organization))
                .collect(Collectors.toList());
    }

    /**
     * Get invitation by ID (for acceptance page)
     */
    public InvitationResponse getInvitationById(String invitationId) {
        OrganizationInvitation invitation = invitationRepository
                .findByInvitationIdAndIsDeletedFalse(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found"));

        Organization organization = organizationRepository.findById(invitation.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        return mapToResponse(invitation, organization);
    }

    // Helper methods

    private String generateInvitationId() {
        LocalDateTime now = LocalDateTime.now();
        String yearMonth = now.format(DateTimeFormatter.ofPattern("yyyyMM"));
        String prefix = "INV-" + yearMonth + "-";

        String lastId = invitationRepository.findAll().stream()
                .map(OrganizationInvitation::getInvitationId)
                .filter(id -> id != null && id.startsWith(prefix))
                .max(String::compareTo)
                .orElse(null);

        int nextNumber = 1;
        if (lastId != null) {
            String numberPart = lastId.substring(prefix.length());
            nextNumber = Integer.parseInt(numberPart) + 1;
        }

        return prefix + String.format("%05d", nextNumber);
    }

    private String generateUserId() {
        LocalDateTime now = LocalDateTime.now();
        String yearMonth = now.format(DateTimeFormatter.ofPattern("yyyyMM"));
        String prefix = "USR-" + yearMonth + "-";

        String lastId = userRepository.findAll().stream()
                .map(User::getUserId)
                .filter(id -> id != null && id.startsWith(prefix))
                .max(String::compareTo)
                .orElse(null);

        int nextNumber = 1;
        if (lastId != null) {
            String numberPart = lastId.substring(prefix.length());
            nextNumber = Integer.parseInt(numberPart) + 1;
        }

        return prefix + String.format("%05d", nextNumber);
    }

    private InvitationResponse mapToResponse(OrganizationInvitation invitation,
                                              Organization organization) {
        return InvitationResponse.builder()
                .invitationId(invitation.getInvitationId())
                .email(invitation.getEmail())
                .organizationName(organization.getOrganizationName())
                .organizationId(organization.getOrganizationId())
                .invitedByName(invitation.getInvitedByName())
                .roleName(invitation.getRoleName())
                .profileName(invitation.getProfileName())
                .status(invitation.getStatus().name())
                .personalMessage(invitation.getPersonalMessage())
                .sentAt(invitation.getSentAt())
                .expiresAt(invitation.getExpiresAt())
                .isExpired(invitation.isExpired())
                .build();
    }
}
