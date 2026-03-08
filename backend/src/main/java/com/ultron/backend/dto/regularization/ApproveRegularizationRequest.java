package com.ultron.backend.dto.regularization;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for approving/rejecting regularization
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApproveRegularizationRequest {

    @NotBlank(message = "Regularization ID is required")
    private String regularizationId;

    @NotNull(message = "Approval decision is required")
    private Boolean approved;

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;

    @Size(max = 500, message = "Rejection reason must not exceed 500 characters")
    private String rejectionReason;
}
