package com.ultron.backend.service;

import com.ultron.backend.domain.entity.ChatGroup;
import com.ultron.backend.domain.entity.User;
import com.ultron.backend.dto.request.CreateChatGroupRequest;
import com.ultron.backend.dto.response.ChatGroupDTO;
import com.ultron.backend.dto.response.UserResponse;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.multitenancy.TenantContext;
import com.ultron.backend.repository.ChatGroupRepository;
import com.ultron.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatGroupService {

    private final ChatGroupRepository chatGroupRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final UserService userService;

    public ChatGroupDTO createGroup(String creatorId, CreateChatGroupRequest request) {
        String tenantId = TenantContext.getTenantId();

        List<String> memberIds = request.getMemberIds();
        if (!memberIds.contains(creatorId)) {
            memberIds.add(creatorId);
        }

        ChatGroup group = ChatGroup.builder()
                .tenantId(tenantId)
                .name(request.getName())
                .memberIds(memberIds)
                .createdBy(creatorId)
                .createdAt(LocalDateTime.now())
                .build();

        group = chatGroupRepository.save(group);
        log.info("Created chat group {} with {} members", group.getId(), memberIds.size());

        // P1 #19: Notify all group members except creator
        String creatorName = userService.getUserFullName(creatorId);
        for (String memberId : group.getMemberIds()) {
            if (!memberId.equals(creatorId)) {
                try {
                    notificationService.createAndSendNotification(
                        memberId,
                        "Added to Chat Group: " + group.getName(),
                        creatorName + " added you to chat group '" + group.getName() + "'",
                        "CHAT_GROUP_CREATED",
                        "/chat/groups/" + group.getId()
                    );
                } catch (Exception e) {
                    log.error("Failed to send notification for chat group creation to member {}: {}", memberId, e.getMessage());
                }
            }
        }
        log.info("Notifications sent for chat group creation: {}", group.getId());

        return mapToDTO(group);
    }

    public List<ChatGroupDTO> getUserGroups(String userId) {
        String tenantId = TenantContext.getTenantId();
        List<ChatGroup> groups = chatGroupRepository.findByTenantIdAndMemberIdsContaining(tenantId, userId);

        // Fix N+1 query: Batch load all unique members across all groups
        Set<String> allMemberIds = groups.stream()
                .flatMap(group -> group.getMemberIds().stream())
                .collect(Collectors.toSet());

        // Load all users in one query
        Map<String, User> usersMap = userRepository.findAllById(allMemberIds).stream()
                .collect(Collectors.toMap(User::getId, user -> user));

        // Map groups to DTOs using cached users
        return groups.stream()
                .map(group -> mapToDTOWithCachedUsers(group, usersMap))
                .collect(Collectors.toList());
    }

    public ChatGroupDTO getGroupById(String groupId) {
        ChatGroup group = chatGroupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatGroup ID not found: " + groupId));
        return mapToDTO(group);
    }

    private ChatGroupDTO mapToDTO(ChatGroup group) {
        List<User> members = userRepository.findAllById(group.getMemberIds());
        List<UserResponse> memberDTOs = mapUsersToResponses(members);

        return ChatGroupDTO.builder()
                .id(group.getId())
                .name(group.getName())
                .members(memberDTOs)
                .createdBy(group.getCreatedBy())
                .createdAt(group.getCreatedAt())
                .build();
    }

    /**
     * Map group to DTO using pre-loaded user map (avoids N+1 query).
     */
    private ChatGroupDTO mapToDTOWithCachedUsers(ChatGroup group, Map<String, User> usersMap) {
        List<User> members = group.getMemberIds().stream()
                .map(usersMap::get)
                .filter(user -> user != null)
                .collect(Collectors.toList());

        List<UserResponse> memberDTOs = mapUsersToResponses(members);

        return ChatGroupDTO.builder()
                .id(group.getId())
                .name(group.getName())
                .members(memberDTOs)
                .createdBy(group.getCreatedBy())
                .createdAt(group.getCreatedAt())
                .build();
    }

    /**
     * Convert User entities to UserResponse DTOs.
     */
    private List<UserResponse> mapUsersToResponses(List<User> users) {
        return users.stream()
                .map(user -> {
                    UserResponse.UserProfileDTO profileDTO = null;
                    if (user.getProfile() != null) {
                        profileDTO = UserResponse.UserProfileDTO.builder()
                                .firstName(user.getProfile().getFirstName())
                                .lastName(user.getProfile().getLastName())
                                .fullName(user.getProfile().getFullName())
                                .title(user.getProfile().getTitle())
                                .department(user.getProfile().getDepartment())
                                .phone(user.getProfile().getPhone())
                                .mobilePhone(user.getProfile().getMobilePhone())
                                .avatar(user.getProfile().getAvatar())
                                .build();
                    }
                    return UserResponse.builder()
                            .id(user.getId())
                            .username(user.getUsername())
                            .email(user.getEmail())
                            .profile(profileDTO)
                            .role(user.getRole())
                            .build();
                })
                .collect(Collectors.toList());
    }
}
