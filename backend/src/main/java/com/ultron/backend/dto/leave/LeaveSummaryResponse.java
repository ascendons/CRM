package com.ultron.backend.dto.leave;

import com.ultron.backend.domain.enums.LeaveType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Response DTO for leave summary statistics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveSummaryResponse {

    private Integer year;
    private Integer totalLeavesTaken;
    private Integer totalPendingLeaves;
    private Integer totalRejectedLeaves;

    private Map<LeaveType, Integer> leavesByType;

    private Double totalDaysUsed;
    private Double totalDaysPending;
    private Double totalDaysAvailable;

    private Integer emergencyLeavesCount;
    private Integer halfDaysCount;
}
