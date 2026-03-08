package com.ultron.backend.dto.shift;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for bulk assignment result
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkAssignmentResult {

    private Integer totalRequested;
    private Integer successCount;
    private Integer failureCount;

    private List<ShiftAssignmentResponse> successful;
    private List<FailedAssignment> failed;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FailedAssignment {
        private String userId;
        private String userName;
        private String reason;
    }
}
