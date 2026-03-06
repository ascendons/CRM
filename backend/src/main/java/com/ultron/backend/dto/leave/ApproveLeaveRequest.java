package com.ultron.backend.dto.leave;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for approving or rejecting a leave
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApproveLeaveRequest {

    @NotBlank(message = "Leave ID is required")
    private String leaveId;

    @NotNull(message = "Approval decision is required")
    private Boolean approved;

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;

    @Size(max = 500, message = "Rejection reason must not exceed 500 characters")
    private String rejectionReason;
}
