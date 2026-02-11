package com.ultron.backend.dto.response;

import com.ultron.backend.domain.entity.LeadAssignmentConfig;
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
public class LeadAssignmentConfigResponse {

    private String id;
    private String tenantId;
    private List<EligibleRoleInfo> eligibleRoles;
    private LeadAssignmentConfig.AssignmentStrategy strategy;
    private Boolean enabled;
    private LocalDateTime createdAt;
    private LocalDateTime lastModifiedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EligibleRoleInfo {
        private String roleId;
        private String roleName;
    }
}
