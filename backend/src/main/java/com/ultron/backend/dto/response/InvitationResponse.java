package com.ultron.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvitationResponse {

    private String invitationId;
    private String email;
    private String organizationName;
    private String organizationId;
    private String invitedByName;
    private String roleName;
    private String profileName;
    private String status;
    private String personalMessage;
    private LocalDateTime sentAt;
    private LocalDateTime expiresAt;
    private boolean isExpired;
}
