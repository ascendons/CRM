package com.ultron.backend.dto.shift;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Response DTO for shift assignment
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftAssignmentResponse {

    private String id;
    private String tenantId;
    private String userId;
    private String userName;
    private String shiftId;
    private String shiftName;
    private String officeLocationId;
    private String officeLocationName;
    private LocalDate effectiveDate;
    private LocalDate endDate;
    private Boolean isTemporary;
    private String reason;
}
