package com.ultron.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateChatGroupRequest {
    
    @NotBlank(message = "Group name is required")
    private String name;
    
    @NotEmpty(message = "A group must have at least one member")
    private List<String> memberIds;
}
