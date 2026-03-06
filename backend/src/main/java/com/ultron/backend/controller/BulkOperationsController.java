package com.ultron.backend.controller;

import com.ultron.backend.dto.ApiResponse;
import com.ultron.backend.dto.shift.BulkAssignmentResult;
import com.ultron.backend.dto.shift.BulkShiftAssignmentRequest;
import com.ultron.backend.service.BulkShiftAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for bulk operations
 */
@RestController
@RequestMapping("/api/admin/bulk")
@RequiredArgsConstructor
@Slf4j
public class BulkOperationsController {

    private final BulkShiftAssignmentService bulkShiftAssignmentService;

    /**
     * Bulk assign shift to multiple users
     */
    @PostMapping("/assign-shift")
    @PreAuthorize("hasPermission('SHIFT', 'ASSIGN')")
    public ResponseEntity<ApiResponse<BulkAssignmentResult>> bulkAssignShift(
            @Valid @RequestBody BulkShiftAssignmentRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("User {} performing bulk shift assignment for {} users",
                userId, request.getUserIds().size());

        BulkAssignmentResult result = bulkShiftAssignmentService.bulkAssignShift(request, userId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<BulkAssignmentResult>builder()
                        .success(true)
                        .message(String.format("Bulk assignment completed: %d successful, %d failed",
                                result.getSuccessCount(), result.getFailureCount()))
                        .data(result)
                        .build());
    }
}
