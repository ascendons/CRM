package com.ultron.backend.controller;

import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.holiday.CreateHolidayRequest;
import com.ultron.backend.dto.holiday.HolidayResponse;
import com.ultron.backend.service.HolidayManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for holiday management
 */
@RestController
@RequestMapping("/holidays")
@RequiredArgsConstructor
@Slf4j
public class HolidayController {

    private final HolidayManagementService holidayManagementService;

    /**
     * Create holiday
     */
    @PostMapping
    @PreAuthorize("hasPermission('HOLIDAY', 'CREATE')")
    public ResponseEntity<ApiResponse<HolidayResponse>> createHoliday(
            @Valid @RequestBody CreateHolidayRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("User {} creating holiday", userId);

        HolidayResponse response = holidayManagementService.createHoliday(request, userId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<HolidayResponse>builder()
                        .success(true)
                        .message("Holiday created successfully")
                        .data(response)
                        .build());
    }

    /**
     * Update holiday
     */
    @PutMapping("/{holidayId}")
    @PreAuthorize("hasPermission('HOLIDAY', 'EDIT')")
    public ResponseEntity<ApiResponse<HolidayResponse>> updateHoliday(
            @PathVariable String holidayId,
            @Valid @RequestBody CreateHolidayRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("User {} updating holiday: {}", userId, holidayId);

        HolidayResponse response = holidayManagementService.updateHoliday(holidayId, request, userId);

        return ResponseEntity.ok(
                ApiResponse.<HolidayResponse>builder()
                        .success(true)
                        .message("Holiday updated successfully")
                        .data(response)
                        .build());
    }

    /**
     * Delete holiday
     */
    @DeleteMapping("/{holidayId}")
    @PreAuthorize("hasPermission('HOLIDAY', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteHoliday(
            @PathVariable String holidayId,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("User {} deleting holiday: {}", userId, holidayId);

        holidayManagementService.deleteHoliday(holidayId, userId);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Holiday deleted successfully")
                        .build());
    }

    /**
     * Get holiday by ID
     */
    @GetMapping("/{holidayId}")
    @PreAuthorize("hasPermission('HOLIDAY', 'READ')")
    public ResponseEntity<ApiResponse<HolidayResponse>> getHolidayById(
            @PathVariable String holidayId) {
        log.info("Fetching holiday: {}", holidayId);

        HolidayResponse response = holidayManagementService.getHolidayById(holidayId);

        return ResponseEntity.ok(
                ApiResponse.<HolidayResponse>builder()
                        .success(true)
                        .message("Holiday retrieved successfully")
                        .data(response)
                        .build());
    }

    /**
     * Get holidays by year
     */
    @GetMapping("/year/{year}")
    @PreAuthorize("hasPermission('HOLIDAY', 'READ')")
    public ResponseEntity<ApiResponse<List<HolidayResponse>>> getHolidaysByYear(
            @PathVariable Integer year) {
        log.info("Fetching holidays for year: {}", year);

        List<HolidayResponse> holidays = holidayManagementService.getHolidaysByYear(year);

        return ResponseEntity.ok(
                ApiResponse.<List<HolidayResponse>>builder()
                        .success(true)
                        .message("Holidays retrieved successfully")
                        .data(holidays)
                        .build());
    }

    /**
     * Get all holidays
     */
    @GetMapping
    @PreAuthorize("hasPermission('HOLIDAY', 'READ')")
    public ResponseEntity<ApiResponse<List<HolidayResponse>>> getAllHolidays() {
        log.info("Fetching all holidays");

        List<HolidayResponse> holidays = holidayManagementService.getAllHolidays();

        return ResponseEntity.ok(
                ApiResponse.<List<HolidayResponse>>builder()
                        .success(true)
                        .message("Holidays retrieved successfully")
                        .data(holidays)
                        .build());
    }
}
