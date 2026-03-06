package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.HalfDayType;
import com.ultron.backend.domain.enums.LeaveStatus;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a leave request
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "leaves")
@CompoundIndexes({
        @CompoundIndex(name = "leaveId_tenantId_unique", def = "{'leaveId': 1, 'tenantId': 1}", unique = true),
        @CompoundIndex(name = "tenantId_userId_status", def = "{'tenantId': 1, 'userId': 1, 'status': 1}"),
        @CompoundIndex(name = "tenantId_dates", def = "{'tenantId': 1, 'startDate': 1, 'endDate': 1}"),
        @CompoundIndex(name = "tenantId_status_date", def = "{'tenantId': 1, 'status': 1, 'startDate': -1}"),
        @CompoundIndex(name = "tenantId_approverId", def = "{'tenantId': 1, 'approverId': 1, 'status': 1}")
})
public class Leave {

    @Id
    private String id;

    @Indexed
    private String leaveId; // Format: LVE-YYYY-MM-XXXXX

    @Indexed
    private String tenantId;

    @Indexed
    private String userId;
    private String userName;
    private String userEmail;

    private LeaveType leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double totalDays; // Can be 0.5 for half day
    private Integer businessDays; // Excluding weekends and holidays

    private Boolean isHalfDay;
    private HalfDayType halfDayType;

    private String reason;
    @Builder.Default
    private List<String> attachments = new ArrayList<>(); // URLs to supporting documents

    @Indexed
    private LeaveStatus status;

    // Approval details
    private String approverId;
    private String approverName;
    private LocalDateTime approvedAt;
    private String approvalNotes;
    private String rejectionReason;

    // Cancellation details
    private Boolean isCancelled;
    private LocalDateTime cancelledAt;
    private String cancelledBy;
    private String cancellationReason;

    // Emergency leave
    private Boolean isEmergencyLeave;
    private String emergencyContactNumber;

    // Balance tracking
    private Double balanceBefore;
    private Double balanceAfter;

    // Contact details during leave
    private String contactNumberDuringLeave;
    private String alternateEmail;

    // Manager notes
    private String managerNotes;

    // System notes
    private String systemNotes;

    // Audit fields
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;

    @Indexed
    private Boolean isDeleted;
    private LocalDateTime deletedAt;
    private String deletedBy;
}
