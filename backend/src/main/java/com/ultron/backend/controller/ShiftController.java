package com.ultron.backend.controller;

import com.ultron.backend.dto.request.CreateShiftRequest;
import com.ultron.backend.dto.request.UpdateShiftRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.ShiftResponse;
import com.ultron.backend.service.ShiftService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/shifts")
@RequiredArgsConstructor
@Slf4j
public class ShiftController {

    private final ShiftService shiftService;

    /**
     * Create new shift
     * POST /api/v1/shifts
     */
    @PostMapping
    @PreAuthorize("hasPermission('SHIFT', 'CREATE')")
    public ResponseEntity<ApiResponse<ShiftResponse>> createShift(
            @Valid @RequestBody CreateShiftRequest request) {

        log.info("Creating new shift: {}", request.getName());

        ShiftResponse response = shiftService.createShift(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.<ShiftResponse>builder()
                        .success(true)
                        .message("Shift created successfully")
                        .data(response)
                        .build());
    }

    /**
     * Update shift
     * PUT /api/v1/shifts/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('SHIFT', 'EDIT')")
    public ResponseEntity<ApiResponse<ShiftResponse>> updateShift(
            @PathVariable String id,
            @Valid @RequestBody UpdateShiftRequest request) {

        log.info("Updating shift: {}", id);

        ShiftResponse response = shiftService.updateShift(id, request);

        return ResponseEntity.ok(
                ApiResponse.<ShiftResponse>builder()
                        .success(true)
                        .message("Shift updated successfully")
                        .data(response)
                        .build());
    }

    /**
     * Delete shift
     * DELETE /api/v1/shifts/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('SHIFT', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteShift(@PathVariable String id) {
        log.info("Deleting shift: {}", id);

        shiftService.deleteShift(id);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Shift deleted successfully")
                        .build());
    }

    /**
     * Get shift by ID
     * GET /api/v1/shifts/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('SHIFT', 'READ')")
    public ResponseEntity<ApiResponse<ShiftResponse>> getShiftById(@PathVariable String id) {
        log.info("Fetching shift: {}", id);

        ShiftResponse response = shiftService.getShiftResponseById(id);

        return ResponseEntity.ok(
                ApiResponse.<ShiftResponse>builder()
                        .success(true)
                        .message("Shift retrieved successfully")
                        .data(response)
                        .build());
    }

    /**
     * Get all shifts
     * GET /api/v1/shifts
     */
    @GetMapping
    @PreAuthorize("hasPermission('SHIFT', 'READ')")
    public ResponseEntity<ApiResponse<List<ShiftResponse>>> getAllShifts() {
        log.info("Fetching all shifts");

        List<ShiftResponse> response = shiftService.getAllShifts();

        return ResponseEntity.ok(
                ApiResponse.<List<ShiftResponse>>builder()
                        .success(true)
                        .message("Shifts retrieved successfully")
                        .data(response)
                        .build());
    }

    /**
     * Get active shifts only
     * GET /api/v1/shifts/active
     */
    @GetMapping("/active")
    @PreAuthorize("hasPermission('SHIFT', 'READ')")
    public ResponseEntity<ApiResponse<List<ShiftResponse>>> getActiveShifts() {
        log.info("Fetching active shifts");

        List<ShiftResponse> response = shiftService.getActiveShifts();

        return ResponseEntity.ok(
                ApiResponse.<List<ShiftResponse>>builder()
                        .success(true)
                        .message("Active shifts retrieved successfully")
                        .data(response)
                        .build());
    }
}
