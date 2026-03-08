package com.ultron.backend.dto.regularization;

import com.ultron.backend.domain.enums.RegularizationStatus;
import com.ultron.backend.domain.enums.RegularizationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for regularization details
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegularizationResponse {

    private String id;
    private String regularizationId;
    private String tenantId;

    private String attendanceId;

    private String userId;
    private String userName;
    private String userEmail;

    private LocalDate attendanceDate;
    private RegularizationType type;

    private LocalDateTime requestedCheckInTime;
    private LocalDateTime requestedCheckOutTime;
    private LocalDateTime originalCheckInTime;
    private LocalDateTime originalCheckOutTime;

    private Double requestedLatitude;
    private Double requestedLongitude;
    private String requestedAddress;

    private String reason;
    private List<String> supportingDocuments;

    private RegularizationStatus status;

    private String approverId;
    private String approverName;
    private LocalDateTime approvedAt;
    private String approvalNotes;
    private String rejectionReason;

    private String managerNotes;
    private String systemNotes;

    private Boolean isAutoApproved;
    private String autoApprovalReason;

    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
}
