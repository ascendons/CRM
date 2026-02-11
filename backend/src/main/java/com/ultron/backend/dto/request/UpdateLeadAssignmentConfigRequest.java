package com.ultron.backend.dto.request;

import com.ultron.backend.domain.entity.LeadAssignmentConfig;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class UpdateLeadAssignmentConfigRequest {

    @NotEmpty(message = "At least one eligible role must be specified")
    private List<String> eligibleRoleIds;

    private LeadAssignmentConfig.AssignmentStrategy strategy;

    private Boolean enabled;
}
