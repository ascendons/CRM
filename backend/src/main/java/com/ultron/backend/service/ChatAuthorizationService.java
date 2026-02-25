package com.ultron.backend.service;

import com.ultron.backend.domain.entity.ChatGroup;
import com.ultron.backend.domain.entity.ChatMessage;
import com.ultron.backend.multitenancy.TenantContext;
import com.ultron.backend.repository.ChatGroupRepository;
import com.ultron.backend.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Service to handle authorization checks for chat operations.
 * Ensures users can only access chat data they have permission to view.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatAuthorizationService {

    private final ChatGroupRepository chatGroupRepository;
    private final ChatMessageRepository chatMessageRepository;

    /**
     * Check if a user can read chat messages for a given recipient.
     *
     * @param userId        The user requesting access
     * @param recipientId   The recipient ID (user ID, group ID, or "ALL")
     * @param recipientType The type of recipient ("USER", "GROUP", or "ALL")
     * @return true if user has permission, false otherwise
     */
    public boolean canReadChat(String userId, String recipientId, String recipientType) {
        String tenantId = TenantContext.getTenantId();

        if (tenantId == null) {
            log.warn("TenantId is null - denying chat access");
            return false;
        }

        // Allow reading broadcast messages for all users in the tenant
        if ("ALL".equalsIgnoreCase(recipientId)) {
            return true;
        }

        // For group chats, verify user is a member
        if ("GROUP".equalsIgnoreCase(recipientType)) {
            return isGroupMember(userId, recipientId, tenantId);
        }

        // For direct messages, user can read if they are either sender or recipient
        // Also verify there's an existing conversation between these users
        if ("USER".equalsIgnoreCase(recipientType)) {
            return userId.equals(recipientId) ||
                   hasConversationWith(userId, recipientId, tenantId);
        }

        log.warn("Unknown recipient type: {} - denying access", recipientType);
        return false;
    }

    /**
     * Check if a user can send a message to a given recipient.
     *
     * @param senderId      The user sending the message
     * @param recipientId   The recipient ID (user ID, group ID, or "ALL")
     * @param recipientType The type of recipient ("USER", "GROUP", or "ALL")
     * @return true if user can send, false otherwise
     */
    public boolean canSendMessage(String senderId, String recipientId, String recipientType) {
        String tenantId = TenantContext.getTenantId();

        if (tenantId == null) {
            log.warn("TenantId is null - denying message send");
            return false;
        }

        // Allow broadcast messages (can be restricted by role if needed)
        if ("ALL".equalsIgnoreCase(recipientId)) {
            return true;
        }

        // For group messages, sender must be a member
        if ("GROUP".equalsIgnoreCase(recipientType)) {
            boolean isMember = isGroupMember(senderId, recipientId, tenantId);
            if (!isMember) {
                log.warn("User {} attempted to send message to group {} but is not a member",
                        senderId, recipientId);
            }
            return isMember;
        }

        // For direct messages, allow sending to any user in the same tenant
        // (recipient existence should be validated separately)
        if ("USER".equalsIgnoreCase(recipientType)) {
            return !senderId.equals(recipientId); // Can't message yourself
        }

        log.warn("Unknown recipient type: {} - denying message send", recipientType);
        return false;
    }

    /**
     * Check if a user is a member of a group.
     *
     * @param userId  The user ID to check
     * @param groupId The group ID
     * @param tenantId The tenant ID
     * @return true if user is a member, false otherwise
     */
    public boolean isGroupMember(String userId, String groupId, String tenantId) {
        Optional<ChatGroup> groupOpt = chatGroupRepository.findById(groupId);

        if (groupOpt.isEmpty()) {
            log.warn("Group {} not found", groupId);
            return false;
        }

        ChatGroup group = groupOpt.get();

        // Verify group belongs to the same tenant
        if (!group.getTenantId().equals(tenantId)) {
            log.warn("Group {} belongs to different tenant - access denied", groupId);
            return false;
        }

        // Check if user is in the member list
        boolean isMember = group.getMemberIds().contains(userId);

        if (!isMember) {
            log.debug("User {} is not a member of group {}", userId, groupId);
        }

        return isMember;
    }

    /**
     * Check if two users have an existing conversation.
     * This prevents users from arbitrarily reading other users' chats.
     *
     * @param userId1  First user ID
     * @param userId2  Second user ID
     * @param tenantId The tenant ID
     * @return true if conversation exists, false otherwise
     */
    public boolean hasConversationWith(String userId1, String userId2, String tenantId) {
        // Check if there's at least one message between these two users
        return chatMessageRepository.existsByTenantIdAndSenderIdAndRecipientIdOrTenantIdAndSenderIdAndRecipientId(
                tenantId, userId1, userId2,
                tenantId, userId2, userId1
        );
    }

    /**
     * Verify user can manage (create, update, delete) a chat group.
     *
     * @param userId  The user attempting the operation
     * @param groupId The group ID
     * @return true if user is the creator or admin, false otherwise
     */
    public boolean canManageGroup(String userId, String groupId) {
        String tenantId = TenantContext.getTenantId();

        Optional<ChatGroup> groupOpt = chatGroupRepository.findById(groupId);

        if (groupOpt.isEmpty()) {
            return false;
        }

        ChatGroup group = groupOpt.get();

        // Verify tenant match
        if (!group.getTenantId().equals(tenantId)) {
            log.warn("User {} attempted to manage group {} from different tenant", userId, groupId);
            return false;
        }

        // Only creator can manage (can extend to check for admin role if needed)
        return group.getCreatedBy().equals(userId);
    }
}
