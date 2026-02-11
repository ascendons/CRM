package com.ultron.backend.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Configuration for automatic lead assignment
 * One config per tenant/organization
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "lead_assignment_configs")
public class LeadAssignmentConfig {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    /**
     * List of role IDs that are eligible for lead assignment
     * Example: ["ROLE-00002", "ROLE-00003"]
     */
    private List<String> eligibleRoleIds;

    /**
     * Assignment strategy to use
     * Values: ROUND_ROBIN, LEAST_LOADED
     */
    @Builder.Default
    private AssignmentStrategy strategy = AssignmentStrategy.ROUND_ROBIN;

    /**
     * Enable/disable auto-assignment
     */
    @Builder.Default
    private Boolean enabled = true;

    /**
     * For round-robin: track the last assigned user index
     */
    private Integer lastAssignedIndex;

    // Audit fields
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;

    public enum AssignmentStrategy {
        ROUND_ROBIN,
        LEAST_LOADED
    }
}
