package com.ultron.backend.controller;

import com.ultron.backend.dto.request.CreateOfficeLocationRequest;
import com.ultron.backend.dto.request.UpdateOfficeLocationRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.OfficeLocationResponse;
import com.ultron.backend.service.OfficeLocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/office-locations")
@RequiredArgsConstructor
@Slf4j
public class OfficeLocationController {

    private final OfficeLocationService officeLocationService;

    /**
     * Create new office location
     * POST /api/v1/office-locations
     */
    @PostMapping
    @PreAuthorize("hasPermission('LOCATION', 'CREATE')")
    public ResponseEntity<ApiResponse<OfficeLocationResponse>> createLocation(
            @Valid @RequestBody CreateOfficeLocationRequest request) {

        log.info("Creating new office location: {}", request.getName());

        OfficeLocationResponse response = officeLocationService.createLocation(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.<OfficeLocationResponse>builder()
                        .success(true)
                        .message("Office location created successfully")
                        .data(response)
                        .build());
    }

    /**
     * Update office location
     * PUT /api/v1/office-locations/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasPermission('LOCATION', 'EDIT')")
    public ResponseEntity<ApiResponse<OfficeLocationResponse>> updateLocation(
            @PathVariable String id,
            @Valid @RequestBody UpdateOfficeLocationRequest request) {

        log.info("Updating office location: {}", id);

        OfficeLocationResponse response = officeLocationService.updateLocation(id, request);

        return ResponseEntity.ok(
                ApiResponse.<OfficeLocationResponse>builder()
                        .success(true)
                        .message("Office location updated successfully")
                        .data(response)
                        .build());
    }

    /**
     * Delete office location
     * DELETE /api/v1/office-locations/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission('LOCATION', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteLocation(@PathVariable String id) {
        log.info("Deleting office location: {}", id);

        officeLocationService.deleteLocation(id);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Office location deleted successfully")
                        .build());
    }

    /**
     * Get office location by ID
     * GET /api/v1/office-locations/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasPermission('LOCATION', 'READ')")
    public ResponseEntity<ApiResponse<OfficeLocationResponse>> getLocationById(@PathVariable String id) {
        log.info("Fetching office location: {}", id);

        OfficeLocationResponse response = officeLocationService.getLocationResponseById(id);

        return ResponseEntity.ok(
                ApiResponse.<OfficeLocationResponse>builder()
                        .success(true)
                        .message("Office location retrieved successfully")
                        .data(response)
                        .build());
    }

    /**
     * Get all office locations
     * GET /api/v1/office-locations
     */
    @GetMapping
    @PreAuthorize("hasPermission('LOCATION', 'READ')")
    public ResponseEntity<ApiResponse<List<OfficeLocationResponse>>> getAllLocations() {
        log.info("Fetching all office locations");

        List<OfficeLocationResponse> response = officeLocationService.getAllLocations();

        return ResponseEntity.ok(
                ApiResponse.<List<OfficeLocationResponse>>builder()
                        .success(true)
                        .message("Office locations retrieved successfully")
                        .data(response)
                        .build());
    }

    /**
     * Get active office locations only
     * GET /api/v1/office-locations/active
     */
    @GetMapping("/active")
    @PreAuthorize("hasPermission('LOCATION', 'READ')")
    public ResponseEntity<ApiResponse<List<OfficeLocationResponse>>> getActiveLocations() {
        log.info("Fetching active office locations");

        List<OfficeLocationResponse> response = officeLocationService.getActiveLocations();

        return ResponseEntity.ok(
                ApiResponse.<List<OfficeLocationResponse>>builder()
                        .success(true)
                        .message("Active office locations retrieved successfully")
                        .data(response)
                        .build());
    }
}
