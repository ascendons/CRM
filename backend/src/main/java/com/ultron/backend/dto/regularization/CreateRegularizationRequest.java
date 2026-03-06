package com.ultron.backend.dto.regularization;

import com.ultron.backend.domain.enums.RegularizationType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Request DTO for creating attendance regularization
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRegularizationRequest {

    private String attendanceId; // Optional - may not exist for missed check-in

    @NotNull(message = "Attendance date is required")
    @PastOrPresent(message = "Attendance date cannot be in the future")
    private LocalDate attendanceDate;

    @NotNull(message = "Regularization type is required")
    private RegularizationType type;

    private LocalDateTime requestedCheckInTime;
    private LocalDateTime requestedCheckOutTime;

    // Location for wrong location correction
    private Double requestedLatitude;
    private Double requestedLongitude;
    private String requestedAddress;

    @NotNull(message = "Reason is required")
    @Size(min = 10, max = 1000, message = "Reason must be between 10 and 1000 characters")
    private String reason;

    private List<String> supportingDocuments; // URLs to uploaded documents
}
