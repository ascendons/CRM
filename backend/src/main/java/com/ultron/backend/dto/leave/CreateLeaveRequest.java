package com.ultron.backend.dto.leave;

import com.ultron.backend.domain.enums.HalfDayType;
import com.ultron.backend.domain.enums.LeaveType;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Request DTO for creating a new leave
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLeaveRequest {

    @NotNull(message = "Leave type is required")
    private LeaveType leaveType;

    @NotNull(message = "Start date is required")
    @FutureOrPresent(message = "Start date cannot be in the past")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    @FutureOrPresent(message = "End date cannot be in the past")
    private LocalDate endDate;

    @NotNull(message = "Reason is required")
    @Size(min = 10, max = 1000, message = "Reason must be between 10 and 1000 characters")
    private String reason;

    private Boolean isHalfDay;
    private HalfDayType halfDayType;

    private List<String> attachments; // URLs to uploaded documents

    private Boolean isEmergencyLeave;
    private String emergencyContactNumber;

    private String contactNumberDuringLeave;
    private String alternateEmail;
}
