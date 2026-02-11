package com.ultron.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AssignLeadRequest {

    @NotBlank(message = "User ID is required")
    private String userId;
}
