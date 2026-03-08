package com.ultron.backend.dto.leave;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for cancelling a leave
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelLeaveRequest {

    @NotBlank(message = "Leave ID is required")
    private String leaveId;

    @NotBlank(message = "Cancellation reason is required")
    @Size(min = 10, max = 500, message = "Cancellation reason must be between 10 and 500 characters")
    private String cancellationReason;
}
