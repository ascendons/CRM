package com.ultron.backend.dto.response;

import com.ultron.backend.domain.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String userId;
    private String email;
    private String fullName;
    private UserRole role;
    private String token;
}
