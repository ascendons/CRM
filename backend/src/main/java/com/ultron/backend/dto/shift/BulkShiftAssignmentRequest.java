package com.ultron.backend.dto.shift;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Request DTO for bulk shift assignment
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkShiftAssignmentRequest {

    @NotEmpty(message = "User IDs are required")
    private List<String> userIds;

    @NotNull(message = "Shift ID is required")
    private String shiftId;

    private String officeLocationId;

    @NotNull(message = "Effective date is required")
    private LocalDate effectiveDate;

    private LocalDate endDate; // null for ongoing

    private Boolean isTemporary;
    private String reason;
}
