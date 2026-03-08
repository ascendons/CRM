package com.ultron.backend.dto.leave;

import com.ultron.backend.domain.enums.LeaveType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Response DTO for leave balance
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveBalanceResponse {

    private String id;
    private String tenantId;
    private String userId;
    private String userName;
    private Integer year;

    private Map<LeaveType, LeaveTypeBalanceDto> balances;

    private LocalDateTime createdAt;
    private LocalDateTime lastModifiedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LeaveTypeBalanceDto {
        private Double total;
        private Double used;
        private Double pending;
        private Double available;
        private Boolean isCarryForward;
        private Double carriedForward;
        private LocalDateTime lastUpdated;
    }
}
