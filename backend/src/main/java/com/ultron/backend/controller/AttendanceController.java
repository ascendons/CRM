package com.ultron.backend.controller;

import com.ultron.backend.dto.request.BreakEndRequest;
import com.ultron.backend.dto.request.BreakStartRequest;
import com.ultron.backend.dto.request.CheckInRequest;
import com.ultron.backend.dto.request.CheckOutRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.AttendanceResponse;
import com.ultron.backend.dto.attendance.DailyAttendanceDashboardResponse;
import com.ultron.backend.dto.attendance.DetailedDailyAttendanceDto;
import com.ultron.backend.dto.attendance.MonthlyAttendanceReportResponse;
import com.ultron.backend.dto.attendance.TeamAttendanceResponse;
import com.ultron.backend.service.AttendanceReportService;
import com.ultron.backend.service.AttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/attendance")
@RequiredArgsConstructor
@Slf4j
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final AttendanceReportService attendanceReportService;

    /**
     * Check in
     * POST /api/v1/attendance/check-in
     */
    @PostMapping("/check-in")
    @PreAuthorize("hasPermission('ATTENDANCE', 'CREATE')")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkIn(
            @Valid @RequestBody CheckInRequest request) {

        String currentUserId = getCurrentUserId();
        log.info("User {} checking in at location ({}, {})", currentUserId, request.getLatitude(), request.getLongitude());

        AttendanceResponse response = attendanceService.checkIn(request, currentUserId);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.<AttendanceResponse>builder()
                        .success(true)
                        .message("Checked in successfully")
                        .data(response)
                        .build());
    }

    /**
     * Check out
     * POST /api/v1/attendance/check-out
     */
    @PostMapping("/check-out")
    @PreAuthorize("hasPermission('ATTENDANCE', 'EDIT')")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkOut(
            @Valid @RequestBody CheckOutRequest request) {

        String currentUserId = getCurrentUserId();
        log.info("User {} checking out", currentUserId);

        AttendanceResponse response = attendanceService.checkOut(request, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<AttendanceResponse>builder()
                        .success(true)
                        .message("Checked out successfully")
                        .data(response)
                        .build());
    }

    /**
     * Start break
     * POST /api/v1/attendance/break/start
     */
    @PostMapping("/break/start")
    @PreAuthorize("hasPermission('ATTENDANCE', 'EDIT')")
    public ResponseEntity<ApiResponse<AttendanceResponse>> startBreak(
            @Valid @RequestBody BreakStartRequest request) {

        String currentUserId = getCurrentUserId();
        log.info("User {} starting break", currentUserId);

        AttendanceResponse response = attendanceService.startBreak(request, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<AttendanceResponse>builder()
                        .success(true)
                        .message("Break started successfully")
                        .data(response)
                        .build());
    }

    /**
     * End break
     * POST /api/v1/attendance/break/end
     */
    @PostMapping("/break/end")
    @PreAuthorize("hasPermission('ATTENDANCE', 'EDIT')")
    public ResponseEntity<ApiResponse<AttendanceResponse>> endBreak(
            @Valid @RequestBody BreakEndRequest request) {

        String currentUserId = getCurrentUserId();
        log.info("User {} ending break", currentUserId);

        AttendanceResponse response = attendanceService.endBreak(request, currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<AttendanceResponse>builder()
                        .success(true)
                        .message("Break ended successfully")
                        .data(response)
                        .build());
    }

    /**
     * Get my today's attendance
     * GET /api/v1/attendance/my/today
     */
    @GetMapping("/my/today")
    @PreAuthorize("hasPermission('ATTENDANCE', 'READ')")
    public ResponseEntity<ApiResponse<AttendanceResponse>> getMyTodayAttendance() {
        String currentUserId = getCurrentUserId();
        log.info("User {} fetching today's attendance", currentUserId);

        AttendanceResponse response = attendanceService.getTodayAttendance(currentUserId);

        return ResponseEntity.ok(
                ApiResponse.<AttendanceResponse>builder()
                        .success(true)
                        .message(response != null ? "Attendance retrieved successfully" : "No attendance record for today")
                        .data(response)
                        .build());
    }

    /**
     * Get my attendance history
     * GET /api/v1/attendance/my/history?startDate=2026-03-01&endDate=2026-03-31
     */
    @GetMapping("/my/history")
    @PreAuthorize("hasPermission('ATTENDANCE', 'READ')")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getMyAttendanceHistory(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        String currentUserId = getCurrentUserId();
        log.info("User {} fetching attendance history from {} to {}", currentUserId, startDate, endDate);

        List<AttendanceResponse> response = attendanceService.getUserAttendance(currentUserId, startDate, endDate);

        return ResponseEntity.ok(
                ApiResponse.<List<AttendanceResponse>>builder()
                        .success(true)
                        .message("Attendance history retrieved successfully")
                        .data(response)
                        .build());
    }

    /**
     * Admin: Get daily dashboard
     * GET /api/v1/attendance/admin/dashboard/daily?date=2026-03-07
     */
    @GetMapping("/admin/dashboard/daily")
    @PreAuthorize("hasPermission('ATTENDANCE', 'READ_ALL')")
    public ResponseEntity<ApiResponse<DailyAttendanceDashboardResponse>> getDailyDashboard(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        LocalDate targetDate = date != null ? date : LocalDate.now();
        log.info("Fetching daily attendance dashboard for date: {}", targetDate);

        DailyAttendanceDashboardResponse response = attendanceReportService.getDailyDashboard(targetDate);

        return ResponseEntity.ok(
                ApiResponse.<DailyAttendanceDashboardResponse>builder()
                        .success(true)
                        .message("Daily attendance dashboard retrieved successfully")
                        .data(response)
                        .build());
    }

    /**
     * Admin: Get monthly report for a user
     * GET /api/v1/attendance/admin/report/monthly/{userId}?year=2026&month=3
     */
    @GetMapping("/admin/report/monthly/{userId}")
    @PreAuthorize("hasPermission('ATTENDANCE', 'READ_ALL')")
    public ResponseEntity<ApiResponse<MonthlyAttendanceReportResponse>> getMonthlyReport(
            @PathVariable String userId,
            @RequestParam Integer year,
            @RequestParam Integer month) {

        log.info("Generating monthly report for user: {} year: {} month: {}", userId, year, month);

        MonthlyAttendanceReportResponse response = attendanceReportService.getMonthlyReport(userId, year, month);

        return ResponseEntity.ok(
                ApiResponse.<MonthlyAttendanceReportResponse>builder()
                        .success(true)
                        .message("Monthly report generated successfully")
                        .data(response)
                        .build());
    }

    /**
     * Get my monthly summary (quick stats)
     * GET /api/v1/attendance/my/summary?year=2026&month=3
     */
    @GetMapping("/my/summary")
    @PreAuthorize("hasPermission('ATTENDANCE', 'READ')")
    public ResponseEntity<ApiResponse<com.ultron.backend.dto.response.AttendanceSummaryResponse>> getMySummary(
            @RequestParam Integer year,
            @RequestParam Integer month) {

        String currentUserId = getCurrentUserId();
        log.info("User {} fetching monthly summary for year: {} month: {}", currentUserId, year, month);

        com.ultron.backend.dto.response.AttendanceSummaryResponse response =
            attendanceReportService.getUserMonthlySummary(currentUserId, year, month);

        return ResponseEntity.ok(
                ApiResponse.<com.ultron.backend.dto.response.AttendanceSummaryResponse>builder()
                        .success(true)
                        .message("Monthly summary retrieved successfully")
                        .data(response)
                        .build());
    }

    /**
     * Get my monthly report
     * GET /api/v1/attendance/my/report/monthly?year=2026&month=3
     */
    @GetMapping("/my/report/monthly")
    @PreAuthorize("hasPermission('ATTENDANCE', 'READ')")
    public ResponseEntity<ApiResponse<MonthlyAttendanceReportResponse>> getMyMonthlyReport(
            @RequestParam Integer year,
            @RequestParam Integer month) {

        String currentUserId = getCurrentUserId();
        log.info("User {} fetching monthly report for year: {} month: {}", currentUserId, year, month);

        MonthlyAttendanceReportResponse response = attendanceReportService.getMonthlyReport(currentUserId, year, month);

        return ResponseEntity.ok(
                ApiResponse.<MonthlyAttendanceReportResponse>builder()
                        .success(true)
                        .message("Monthly report generated successfully")
                        .data(response)
                        .build());
    }

    /**
     * Manager: Get team attendance
     * GET /api/v1/attendance/admin/team?startDate=2026-03-01&endDate=2026-03-31
     */
    @GetMapping("/admin/team")
    @PreAuthorize("hasPermission('ATTENDANCE', 'READ_ALL')")
    public ResponseEntity<ApiResponse<TeamAttendanceResponse>> getTeamAttendance(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        String currentUserId = getCurrentUserId();
        log.info("Manager {} fetching team attendance from {} to {}", currentUserId, startDate, endDate);

        TeamAttendanceResponse response = attendanceReportService.getTeamAttendance(currentUserId, startDate, endDate);

        return ResponseEntity.ok(
                ApiResponse.<TeamAttendanceResponse>builder()
                        .success(true)
                        .message("Team attendance retrieved successfully")
                        .data(response)
                        .build());
    }

    /**
     * Admin: Get detailed daily attendance for all team members
     * GET /api/v1/attendance/admin/daily-list?date=2026-03-07
     */
    @GetMapping("/admin/daily-list")
    @PreAuthorize("hasPermission('ATTENDANCE', 'READ_ALL')")
    public ResponseEntity<ApiResponse<List<DetailedDailyAttendanceDto>>> getDetailedDailyAttendance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        LocalDate targetDate = date != null ? date : LocalDate.now();
        log.info("Fetching detailed daily attendance list for date: {}", targetDate);

        List<DetailedDailyAttendanceDto> response = attendanceReportService.getDetailedDailyAttendance(targetDate);

        return ResponseEntity.ok(
                ApiResponse.<List<DetailedDailyAttendanceDto>>builder()
                        .success(true)
                        .message("Detailed daily attendance retrieved successfully")
                        .data(response)
                        .build());
    }

    /**
     * Get current user ID from security context
     */
    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }
}
