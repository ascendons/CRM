package com.ultron.backend.dto.leave;

import com.ultron.backend.domain.enums.HalfDayType;
import com.ultron.backend.domain.enums.LeaveStatus;
import com.ultron.backend.domain.enums.LeaveType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for leave details
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveResponse {

    private String id;
    private String leaveId;
    private String tenantId;

    private String userId;
    private String userName;
    private String userEmail;

    private LeaveType leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double totalDays;
    private Integer businessDays;

    private Boolean isHalfDay;
    private HalfDayType halfDayType;

    private String reason;
    private List<String> attachments;

    private LeaveStatus status;

    private String approverId;
    private String approverName;
    private LocalDateTime approvedAt;
    private String approvalNotes;
    private String rejectionReason;

    private Boolean isCancelled;
    private LocalDateTime cancelledAt;
    private String cancelledBy;
    private String cancellationReason;

    private Boolean isEmergencyLeave;
    private String emergencyContactNumber;

    private Double balanceBefore;
    private Double balanceAfter;

    private String contactNumberDuringLeave;
    private String alternateEmail;

    private String managerNotes;
    private String systemNotes;

    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
}
