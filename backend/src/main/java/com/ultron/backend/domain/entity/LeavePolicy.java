package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.LeaveType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Leave Policy Configuration
 * Stores default leave allocations per tenant
 */
@Document(collection = "leave_policies")
@CompoundIndexes({
        @CompoundIndex(name = "tenant_unique", def = "{'tenantId': 1}", unique = true)
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeavePolicy {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    /**
     * Map of leave type to default allocation
     * Example: CASUAL -> 12 days, SICK -> 12 days, EARNED -> 15 days
     */
    private Map<LeaveType, LeaveTypePolicy> leaveTypes;

    /**
     * Whether to allow carry forward of unused leaves to next year
     */
    private Boolean allowCarryForward;

    /**
     * Maximum days that can be carried forward per leave type
     */
    private Map<LeaveType, Double> maxCarryForwardDays;

    /**
     * Whether to pro-rate leaves for mid-year joiners
     */
    private Boolean proRateForNewJoiners;

    // Audit fields
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LeaveTypePolicy {
        /**
         * Default allocation per year
         */
        private Double defaultAllocation;

        /**
         * Whether this leave type can be carried forward
         */
        private Boolean isCarryForward;

        /**
         * Maximum days that can be carried forward
         */
        private Double maxCarryForward;

        /**
         * Minimum notice required in days (e.g., 2 days for casual leave)
         */
        private Integer minNoticeRequired;

        /**
         * Maximum consecutive days allowed (e.g., max 3 days for casual leave)
         */
        private Integer maxConsecutiveDays;

        /**
         * Whether approval is required for this leave type
         */
        private Boolean requiresApproval;

        /**
         * Whether supporting documents are required
         */
        private Boolean requiresDocuments;
    }

    /**
     * Create default policy for a tenant
     */
    public static LeavePolicy createDefaultPolicy(String tenantId) {
        Map<LeaveType, LeaveTypePolicy> leaveTypes = Map.of(
                LeaveType.CASUAL, LeaveTypePolicy.builder()
                        .defaultAllocation(12.0)
                        .isCarryForward(false)
                        .maxCarryForward(0.0)
                        .minNoticeRequired(1)
                        .maxConsecutiveDays(3)
                        .requiresApproval(true)
                        .requiresDocuments(false)
                        .build(),

                LeaveType.SICK, LeaveTypePolicy.builder()
                        .defaultAllocation(12.0)
                        .isCarryForward(false)
                        .maxCarryForward(0.0)
                        .minNoticeRequired(0) // Can apply same day
                        .maxConsecutiveDays(null) // No limit
                        .requiresApproval(true)
                        .requiresDocuments(true) // Medical certificate required
                        .build(),

                LeaveType.EARNED, LeaveTypePolicy.builder()
                        .defaultAllocation(15.0)
                        .isCarryForward(true)
                        .maxCarryForward(15.0) // Can carry forward all
                        .minNoticeRequired(7) // 1 week notice
                        .maxConsecutiveDays(null)
                        .requiresApproval(true)
                        .requiresDocuments(false)
                        .build(),

                LeaveType.PAID, LeaveTypePolicy.builder()
                        .defaultAllocation(0.0) // Granted on case-by-case basis
                        .isCarryForward(false)
                        .maxCarryForward(0.0)
                        .minNoticeRequired(3)
                        .maxConsecutiveDays(null)
                        .requiresApproval(true)
                        .requiresDocuments(false)
                        .build(),

                LeaveType.COMPENSATORY, LeaveTypePolicy.builder()
                        .defaultAllocation(0.0) // Earned by working on holidays
                        .isCarryForward(false)
                        .maxCarryForward(0.0)
                        .minNoticeRequired(1)
                        .maxConsecutiveDays(null)
                        .requiresApproval(true)
                        .requiresDocuments(false)
                        .build()
        );

        return LeavePolicy.builder()
                .tenantId(tenantId)
                .leaveTypes(leaveTypes)
                .allowCarryForward(true)
                .maxCarryForwardDays(Map.of(
                        LeaveType.EARNED, 15.0,
                        LeaveType.CASUAL, 0.0,
                        LeaveType.SICK, 0.0
                ))
                .proRateForNewJoiners(true)
                .createdAt(LocalDateTime.now())
                .createdBy("SYSTEM")
                .build();
    }
}
