package com.ultron.backend.controller;

import com.ultron.backend.dto.request.DispatchRequest;
import com.ultron.backend.dto.request.UpdateScheduleRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.DispatchAssignmentResponse;
import com.ultron.backend.dto.response.EngineerScheduleResponse;
import com.ultron.backend.service.DispatchService;
import com.ultron.backend.service.ScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/dispatch")
@RequiredArgsConstructor
@Slf4j
public class DispatchController {

    private final DispatchService dispatchService;
    private final ScheduleService scheduleService;

    @PostMapping("/assign")
    @PreAuthorize("hasPermission('DISPATCH', 'ASSIGN')")
    public ResponseEntity<ApiResponse<List<DispatchAssignmentResponse>>> dispatch(
            @Valid @RequestBody DispatchRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Dispatched successfully",
                dispatchService.dispatch(request, getCurrentUserId())));
    }

    @PostMapping("/reassign")
    @PreAuthorize("hasPermission('DISPATCH', 'REASSIGN')")
    public ResponseEntity<ApiResponse<List<DispatchAssignmentResponse>>> reassign(
            @Valid @RequestBody DispatchRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Reassigned successfully",
                dispatchService.reassign(request, getCurrentUserId())));
    }

    @GetMapping("/work-order/{workOrderId}")
    @PreAuthorize("hasPermission('DISPATCH', 'VIEW')")
    public ResponseEntity<ApiResponse<List<DispatchAssignmentResponse>>> getByWorkOrder(
            @PathVariable String workOrderId) {
        return ResponseEntity.ok(ApiResponse.success("Assignments retrieved",
                dispatchService.getByWorkOrder(workOrderId)));
    }

    @GetMapping("/engineer/{engineerId}")
    @PreAuthorize("hasPermission('DISPATCH', 'VIEW')")
    public ResponseEntity<ApiResponse<List<DispatchAssignmentResponse>>> getByEngineer(
            @PathVariable String engineerId) {
        return ResponseEntity.ok(ApiResponse.success("Engineer assignments retrieved",
                dispatchService.getByEngineer(engineerId)));
    }

    @GetMapping("/schedules")
    @PreAuthorize("hasPermission('DISPATCH', 'VIEW')")
    public ResponseEntity<ApiResponse<List<EngineerScheduleResponse>>> getDaySchedules(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate target = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(ApiResponse.success("Schedules retrieved",
                scheduleService.getDaySchedules(target)));
    }

    @GetMapping("/schedules/engineer/{engineerId}")
    @PreAuthorize("hasPermission('DISPATCH', 'VIEW')")
    public ResponseEntity<ApiResponse<List<EngineerScheduleResponse>>> getEngineerSchedules(
            @PathVariable String engineerId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.success("Engineer schedules retrieved",
                scheduleService.getEngineerSchedules(engineerId, from, to)));
    }

    @GetMapping("/schedules/available")
    @PreAuthorize("hasPermission('DISPATCH', 'VIEW')")
    public ResponseEntity<ApiResponse<List<EngineerScheduleResponse>>> getAvailableEngineers(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate target = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(ApiResponse.success("Available engineers retrieved",
                scheduleService.getAvailableEngineers(target)));
    }

    @PutMapping("/schedules/engineer/{engineerId}")
    @PreAuthorize("hasPermission('DISPATCH', 'ASSIGN')")
    public ResponseEntity<ApiResponse<EngineerScheduleResponse>> updateSchedule(
            @PathVariable String engineerId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestBody UpdateScheduleRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Schedule updated",
                scheduleService.updateSchedule(engineerId, date, request, getCurrentUserId())));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : null;
    }
}
