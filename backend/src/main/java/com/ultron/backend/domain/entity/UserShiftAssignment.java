package com.ultron.backend.domain.entity;

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

/**
 * User shift assignment entity
 * Maps users to their assigned shifts and office locations
 */
@Document(collection = "user_shift_assignments")
@CompoundIndexes({
        @CompoundIndex(name = "tenantId_userId_effectiveDate", def = "{'tenantId': 1, 'userId': 1, 'effectiveDate': -1}"),
        @CompoundIndex(name = "tenantId_shiftId", def = "{'tenantId': 1, 'shiftId': 1}"),
        @CompoundIndex(name = "tenantId_officeLocationId", def = "{'tenantId': 1, 'officeLocationId': 1}")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserShiftAssignment {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    // User Information
    private String userId;
    private String userName;

    // Shift Information
    private String shiftId;
    private String shiftName;

    // Office Location Information
    private String officeLocationId;
    private String officeLocationName;

    // Assignment Period
    private LocalDate effectiveDate;
    private LocalDate endDate; // null means ongoing

    // Assignment Details
    private Boolean isTemporary;
    private String reason;

    // Audit Fields
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;

    @Builder.Default
    private Boolean isDeleted = false;
    private LocalDateTime deletedAt;
    private String deletedBy;
}
