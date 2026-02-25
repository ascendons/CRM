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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatGroupService {

    private final ChatGroupRepository chatGroupRepository;
    private final UserRepository userRepository;

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

        return mapToDTO(group);
    }

    public List<ChatGroupDTO> getUserGroups(String userId) {
        String tenantId = TenantContext.getTenantId();
        List<ChatGroup> groups = chatGroupRepository.findByTenantIdAndMemberIdsContaining(tenantId, userId);
        return groups.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public ChatGroupDTO getGroupById(String groupId) {
        ChatGroup group = chatGroupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatGroup ID not found: " + groupId));
        return mapToDTO(group);
    }

    private ChatGroupDTO mapToDTO(ChatGroup group) {
        List<User> members = userRepository.findAllById(group.getMemberIds());
        List<UserResponse> memberDTOs = members.stream()
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
                            .role(user.getRole()) // UserRole enum
                            .build();
                })
                .collect(Collectors.toList());

        return ChatGroupDTO.builder()
                .id(group.getId())
                .name(group.getName())
                .members(memberDTOs)
                .createdBy(group.getCreatedBy())
                .createdAt(group.getCreatedAt())
                .build();
    }
}
