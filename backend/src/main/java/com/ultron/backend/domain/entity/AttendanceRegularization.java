package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.RegularizationStatus;
import com.ultron.backend.domain.enums.RegularizationType;
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
 * Entity representing an attendance regularization request
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "attendance_regularizations")
@CompoundIndexes({
        @CompoundIndex(name = "regularizationId_tenantId_unique", def = "{'regularizationId': 1, 'tenantId': 1}", unique = true),
        @CompoundIndex(name = "tenantId_userId_status", def = "{'tenantId': 1, 'userId': 1, 'status': 1}"),
        @CompoundIndex(name = "tenantId_attendanceId", def = "{'tenantId': 1, 'attendanceId': 1}"),
        @CompoundIndex(name = "tenantId_status_date", def = "{'tenantId': 1, 'status': 1, 'attendanceDate': -1}")
})
public class AttendanceRegularization {

    @Id
    private String id;

    @Indexed
    private String regularizationId; // Format: REG-YYYY-MM-XXXXX

    @Indexed
    private String tenantId;

    @Indexed
    private String attendanceId; // Reference to attendance record

    @Indexed
    private String userId;
    private String userName;
    private String userEmail;

    @Indexed
    private LocalDate attendanceDate;

    private RegularizationType type;

    // Requested changes
    private LocalDateTime requestedCheckInTime;
    private LocalDateTime requestedCheckOutTime;
    private LocalDateTime originalCheckInTime;
    private LocalDateTime originalCheckOutTime;

    // Location information
    private Double requestedLatitude;
    private Double requestedLongitude;
    private String requestedAddress;

    private String reason;
    @Builder.Default
    private List<String> supportingDocuments = new ArrayList<>(); // URLs to uploaded documents

    @Indexed
    private RegularizationStatus status;

    // Approval details
    private String approverId;
    private String approverName;
    private LocalDateTime approvedAt;
    private String approvalNotes;
    private String rejectionReason;

    // Manager notes
    private String managerNotes;

    // System notes
    private String systemNotes;

    // Auto-approval settings
    private Boolean isAutoApproved;
    private String autoApprovalReason;

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
