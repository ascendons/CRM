package com.ultron.backend.service;

import com.ultron.backend.domain.entity.ChatGroup;
import com.ultron.backend.multitenancy.TenantContext;
import com.ultron.backend.repository.ChatGroupRepository;
import com.ultron.backend.repository.ChatMessageRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ChatAuthorizationService.
 * Tests all security authorization logic for chat operations.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Chat Authorization Service Tests")
class ChatAuthorizationServiceTest {

    @Mock
    private ChatGroupRepository chatGroupRepository;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @InjectMocks
    private ChatAuthorizationService authorizationService;

    private static final String TENANT_ID = "tenant123";
    private static final String USER_A_ID = "userA";
    private static final String USER_B_ID = "userB";
    private static final String USER_C_ID = "userC";
    private static final String GROUP_ID = "group123";

    @BeforeEach
    void setUp() {
        // Set tenant context for all tests
        TenantContext.setTenantId(TENANT_ID);
        TenantContext.setUserId(USER_A_ID);
    }

    @AfterEach
    void tearDown() {
        // Clean up tenant context
        TenantContext.clear();
    }

    // =========================================================================
    // Tests for canReadChat()
    // =========================================================================

    @Test
    @DisplayName("Should allow reading broadcast messages (ALL)")
    void canReadChat_BroadcastMessages_ShouldAllow() {
        // When
        boolean result = authorizationService.canReadChat(USER_A_ID, "ALL", "ALL");

        // Then
        assertTrue(result, "Users should be able to read broadcast messages");
    }

    @Test
    @DisplayName("Should allow reading own direct messages")
    void canReadChat_DirectMessages_OwnConversation_ShouldAllow() {
        // Given
        when(chatMessageRepository.existsByTenantIdAndSenderIdAndRecipientIdOrTenantIdAndSenderIdAndRecipientId(
                TENANT_ID, USER_A_ID, USER_B_ID,
                TENANT_ID, USER_B_ID, USER_A_ID
        )).thenReturn(true);

        // When
        boolean result = authorizationService.canReadChat(USER_A_ID, USER_B_ID, "USER");

        // Then
        assertTrue(result, "User should be able to read their own conversation");
        verify(chatMessageRepository).existsByTenantIdAndSenderIdAndRecipientIdOrTenantIdAndSenderIdAndRecipientId(
                TENANT_ID, USER_A_ID, USER_B_ID,
                TENANT_ID, USER_B_ID, USER_A_ID
        );
    }

    @Test
    @DisplayName("Should deny reading other users' private conversations")
    void canReadChat_DirectMessages_OthersConversation_ShouldDeny() {
        // Given - User A tries to read conversation between B and C
        when(chatMessageRepository.existsByTenantIdAndSenderIdAndRecipientIdOrTenantIdAndSenderIdAndRecipientId(
                TENANT_ID, USER_A_ID, USER_C_ID,
                TENANT_ID, USER_C_ID, USER_A_ID
        )).thenReturn(false);

        // When
        boolean result = authorizationService.canReadChat(USER_A_ID, USER_C_ID, "USER");

        // Then
        assertFalse(result, "User should NOT be able to read others' private conversations");
    }

    @Test
    @DisplayName("Should allow reading group messages if user is member")
    void canReadChat_GroupMessages_IsMember_ShouldAllow() {
        // Given
        ChatGroup group = ChatGroup.builder()
                .id(GROUP_ID)
                .tenantId(TENANT_ID)
                .name("Test Group")
                .memberIds(Arrays.asList(USER_A_ID, USER_B_ID))
                .createdBy(USER_B_ID)
                .createdAt(LocalDateTime.now())
                .build();

        when(chatGroupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));

        // When
        boolean result = authorizationService.canReadChat(USER_A_ID, GROUP_ID, "GROUP");

        // Then
        assertTrue(result, "Group member should be able to read group messages");
        verify(chatGroupRepository).findById(GROUP_ID);
    }

    @Test
    @DisplayName("Should deny reading group messages if user is not member")
    void canReadChat_GroupMessages_NotMember_ShouldDeny() {
        // Given - User C is not a member
        ChatGroup group = ChatGroup.builder()
                .id(GROUP_ID)
                .tenantId(TENANT_ID)
                .name("Test Group")
                .memberIds(Arrays.asList(USER_A_ID, USER_B_ID))
                .createdBy(USER_B_ID)
                .createdAt(LocalDateTime.now())
                .build();

        when(chatGroupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));

        // When
        boolean result = authorizationService.canReadChat(USER_C_ID, GROUP_ID, "GROUP");

        // Then
        assertFalse(result, "Non-member should NOT be able to read group messages");
    }

    @Test
    @DisplayName("Should deny reading group from different tenant")
    void canReadChat_GroupMessages_DifferentTenant_ShouldDeny() {
        // Given - Group belongs to different tenant
        ChatGroup group = ChatGroup.builder()
                .id(GROUP_ID)
                .tenantId("differentTenant")
                .name("Test Group")
                .memberIds(Arrays.asList(USER_A_ID, USER_B_ID))
                .createdBy(USER_B_ID)
                .createdAt(LocalDateTime.now())
                .build();

        when(chatGroupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));

        // When
        boolean result = authorizationService.canReadChat(USER_A_ID, GROUP_ID, "GROUP");

        // Then
        assertFalse(result, "Should deny access to groups from different tenant");
    }

    @Test
    @DisplayName("Should deny when tenant context is null")
    void canReadChat_NullTenantContext_ShouldDeny() {
        // Given
        TenantContext.clear();

        // When
        boolean result = authorizationService.canReadChat(USER_A_ID, USER_B_ID, "USER");

        // Then
        assertFalse(result, "Should deny when tenant context is null");

        // Restore tenant context
        TenantContext.setTenantId(TENANT_ID);
    }

    // =========================================================================
    // Tests for canSendMessage()
    // =========================================================================

    @Test
    @DisplayName("Should allow sending broadcast messages")
    void canSendMessage_Broadcast_ShouldAllow() {
        // When
        boolean result = authorizationService.canSendMessage(USER_A_ID, "ALL", "ALL");

        // Then
        assertTrue(result, "Users should be able to send broadcast messages");
    }

    @Test
    @DisplayName("Should allow sending direct messages to other users")
    void canSendMessage_DirectMessage_ShouldAllow() {
        // When
        boolean result = authorizationService.canSendMessage(USER_A_ID, USER_B_ID, "USER");

        // Then
        assertTrue(result, "Users should be able to send direct messages");
    }

    @Test
    @DisplayName("Should deny sending messages to self")
    void canSendMessage_ToSelf_ShouldDeny() {
        // When
        boolean result = authorizationService.canSendMessage(USER_A_ID, USER_A_ID, "USER");

        // Then
        assertFalse(result, "Users should NOT be able to message themselves");
    }

    @Test
    @DisplayName("Should allow sending to group if user is member")
    void canSendMessage_GroupMessage_IsMember_ShouldAllow() {
        // Given
        ChatGroup group = ChatGroup.builder()
                .id(GROUP_ID)
                .tenantId(TENANT_ID)
                .name("Test Group")
                .memberIds(Arrays.asList(USER_A_ID, USER_B_ID))
                .createdBy(USER_B_ID)
                .createdAt(LocalDateTime.now())
                .build();

        when(chatGroupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));

        // When
        boolean result = authorizationService.canSendMessage(USER_A_ID, GROUP_ID, "GROUP");

        // Then
        assertTrue(result, "Group members should be able to send messages");
        verify(chatGroupRepository).findById(GROUP_ID);
    }

    @Test
    @DisplayName("Should deny sending to group if user is not member")
    void canSendMessage_GroupMessage_NotMember_ShouldDeny() {
        // Given - User C is not a member
        ChatGroup group = ChatGroup.builder()
                .id(GROUP_ID)
                .tenantId(TENANT_ID)
                .name("Test Group")
                .memberIds(Arrays.asList(USER_A_ID, USER_B_ID))
                .createdBy(USER_B_ID)
                .createdAt(LocalDateTime.now())
                .build();

        when(chatGroupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));

        // When
        boolean result = authorizationService.canSendMessage(USER_C_ID, GROUP_ID, "GROUP");

        // Then
        assertFalse(result, "Non-members should NOT be able to send to group");
    }

    // =========================================================================
    // Tests for isGroupMember()
    // =========================================================================

    @Test
    @DisplayName("Should return true when user is group member")
    void isGroupMember_IsMember_ShouldReturnTrue() {
        // Given
        ChatGroup group = ChatGroup.builder()
                .id(GROUP_ID)
                .tenantId(TENANT_ID)
                .name("Test Group")
                .memberIds(Arrays.asList(USER_A_ID, USER_B_ID))
                .createdBy(USER_B_ID)
                .createdAt(LocalDateTime.now())
                .build();

        when(chatGroupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));

        // When
        boolean result = authorizationService.isGroupMember(USER_A_ID, GROUP_ID, TENANT_ID);

        // Then
        assertTrue(result, "Should return true for group members");
    }

    @Test
    @DisplayName("Should return false when user is not group member")
    void isGroupMember_NotMember_ShouldReturnFalse() {
        // Given
        ChatGroup group = ChatGroup.builder()
                .id(GROUP_ID)
                .tenantId(TENANT_ID)
                .name("Test Group")
                .memberIds(Arrays.asList(USER_A_ID, USER_B_ID))
                .createdBy(USER_B_ID)
                .createdAt(LocalDateTime.now())
                .build();

        when(chatGroupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));

        // When
        boolean result = authorizationService.isGroupMember(USER_C_ID, GROUP_ID, TENANT_ID);

        // Then
        assertFalse(result, "Should return false for non-members");
    }

    @Test
    @DisplayName("Should return false when group does not exist")
    void isGroupMember_GroupNotFound_ShouldReturnFalse() {
        // Given
        when(chatGroupRepository.findById(GROUP_ID)).thenReturn(Optional.empty());

        // When
        boolean result = authorizationService.isGroupMember(USER_A_ID, GROUP_ID, TENANT_ID);

        // Then
        assertFalse(result, "Should return false when group doesn't exist");
    }

    @Test
    @DisplayName("Should return false when group belongs to different tenant")
    void isGroupMember_DifferentTenant_ShouldReturnFalse() {
        // Given
        ChatGroup group = ChatGroup.builder()
                .id(GROUP_ID)
                .tenantId("differentTenant")
                .name("Test Group")
                .memberIds(Arrays.asList(USER_A_ID, USER_B_ID))
                .createdBy(USER_B_ID)
                .createdAt(LocalDateTime.now())
                .build();

        when(chatGroupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));

        // When
        boolean result = authorizationService.isGroupMember(USER_A_ID, GROUP_ID, TENANT_ID);

        // Then
        assertFalse(result, "Should deny access to groups from different tenant");
    }

    // =========================================================================
    // Tests for canManageGroup()
    // =========================================================================

    @Test
    @DisplayName("Should allow group creator to manage group")
    void canManageGroup_Creator_ShouldAllow() {
        // Given
        ChatGroup group = ChatGroup.builder()
                .id(GROUP_ID)
                .tenantId(TENANT_ID)
                .name("Test Group")
                .memberIds(Arrays.asList(USER_A_ID, USER_B_ID))
                .createdBy(USER_A_ID)
                .createdAt(LocalDateTime.now())
                .build();

        when(chatGroupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));

        // When
        boolean result = authorizationService.canManageGroup(USER_A_ID, GROUP_ID);

        // Then
        assertTrue(result, "Group creator should be able to manage group");
    }

    @Test
    @DisplayName("Should deny non-creator from managing group")
    void canManageGroup_NotCreator_ShouldDeny() {
        // Given
        ChatGroup group = ChatGroup.builder()
                .id(GROUP_ID)
                .tenantId(TENANT_ID)
                .name("Test Group")
                .memberIds(Arrays.asList(USER_A_ID, USER_B_ID))
                .createdBy(USER_A_ID)
                .createdAt(LocalDateTime.now())
                .build();

        when(chatGroupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));

        // When
        boolean result = authorizationService.canManageGroup(USER_B_ID, GROUP_ID);

        // Then
        assertFalse(result, "Non-creator should NOT be able to manage group");
    }

    @Test
    @DisplayName("Should deny managing group from different tenant")
    void canManageGroup_DifferentTenant_ShouldDeny() {
        // Given
        ChatGroup group = ChatGroup.builder()
                .id(GROUP_ID)
                .tenantId("differentTenant")
                .name("Test Group")
                .memberIds(Arrays.asList(USER_A_ID, USER_B_ID))
                .createdBy(USER_A_ID)
                .createdAt(LocalDateTime.now())
                .build();

        when(chatGroupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));

        // When
        boolean result = authorizationService.canManageGroup(USER_A_ID, GROUP_ID);

        // Then
        assertFalse(result, "Should deny managing groups from different tenant");
    }

    // =========================================================================
    // Edge Cases
    // =========================================================================

    @Test
    @DisplayName("Should handle null recipient type gracefully")
    void canReadChat_NullRecipientType_ShouldDeny() {
        // When
        boolean result = authorizationService.canReadChat(USER_A_ID, USER_B_ID, null);

        // Then
        assertFalse(result, "Should deny when recipient type is null");
    }

    @Test
    @DisplayName("Should handle unknown recipient type")
    void canReadChat_UnknownRecipientType_ShouldDeny() {
        // When
        boolean result = authorizationService.canReadChat(USER_A_ID, USER_B_ID, "UNKNOWN");

        // Then
        assertFalse(result, "Should deny unknown recipient types");
    }
}
