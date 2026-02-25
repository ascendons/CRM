package com.ultron.backend.controller;

import com.ultron.backend.dto.request.CreateChatGroupRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.ChatGroupDTO;
import com.ultron.backend.service.ChatGroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/chat/groups")
@RequiredArgsConstructor
@Slf4j
public class ChatGroupController {

    private final ChatGroupService chatGroupService;

    @PostMapping
    public ResponseEntity<ApiResponse<ChatGroupDTO>> createGroup(
            @Valid @RequestBody CreateChatGroupRequest request,
            Authentication authentication) {
        
        String userId = authentication.getName();
        ChatGroupDTO group = chatGroupService.createGroup(userId, request);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Group created successfully", group));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ChatGroupDTO>>> getUserGroups(Authentication authentication) {
        String userId = authentication.getName();
        List<ChatGroupDTO> groups = chatGroupService.getUserGroups(userId);
        return ResponseEntity.ok(ApiResponse.success("User groups fetched successfully", groups));
    }
}
