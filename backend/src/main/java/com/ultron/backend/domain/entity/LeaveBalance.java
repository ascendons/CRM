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
import java.util.HashMap;
import java.util.Map;

/**
 * Entity representing leave balance for a user in a specific year
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "leave_balances")
@CompoundIndexes({
        @CompoundIndex(name = "tenantId_userId_year_unique", def = "{'tenantId': 1, 'userId': 1, 'year': 1}", unique = true),
        @CompoundIndex(name = "tenantId_year", def = "{'tenantId': 1, 'year': 1}")
})
public class LeaveBalance {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    @Indexed
    private String userId;
    private String userName;

    @Indexed
    private Integer year;

    // Map of LeaveType to Balance details
    @Builder.Default
    private Map<LeaveType, LeaveTypeBalance> balances = new HashMap<>();

    // Audit fields
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;

    /**
     * Inner class representing balance for a specific leave type
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LeaveTypeBalance {
        private Double total;           // Total allocated for the year
        private Double used;            // Already used
        private Double pending;         // Pending approval
        private Double available;       // Available = total - used - pending

        private Boolean isCarryForward; // Can be carried to next year
        private Double carriedForward;  // Amount carried from previous year

        private LocalDateTime lastUpdated;
    }

    /**
     * Initialize default leave balances for a new user
     */
    public static LeaveBalance initializeDefaultBalance(String tenantId, String userId, String userName, Integer year) {
        Map<LeaveType, LeaveTypeBalance> balances = new HashMap<>();

        // Default allocations (can be configured per tenant)
        balances.put(LeaveType.CASUAL, LeaveTypeBalance.builder()
                .total(12.0)
                .used(0.0)
                .pending(0.0)
                .available(12.0)
                .isCarryForward(false)
                .carriedForward(0.0)
                .lastUpdated(LocalDateTime.now())
                .build());

        balances.put(LeaveType.SICK, LeaveTypeBalance.builder()
                .total(12.0)
                .used(0.0)
                .pending(0.0)
                .available(12.0)
                .isCarryForward(false)
                .carriedForward(0.0)
                .lastUpdated(LocalDateTime.now())
                .build());

        balances.put(LeaveType.EARNED, LeaveTypeBalance.builder()
                .total(15.0)
                .used(0.0)
                .pending(0.0)
                .available(15.0)
                .isCarryForward(true)
                .carriedForward(0.0)
                .lastUpdated(LocalDateTime.now())
                .build());

        return LeaveBalance.builder()
                .tenantId(tenantId)
                .userId(userId)
                .userName(userName)
                .year(year)
                .balances(balances)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
