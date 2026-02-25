package com.ultron.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatGroupDTO {
    private String id;
    private String name;
    private List<UserResponse> members;
    private String createdBy;
    private LocalDateTime createdAt;
}
