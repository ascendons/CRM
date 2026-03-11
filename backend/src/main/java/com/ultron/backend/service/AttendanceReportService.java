package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Attendance;
import com.ultron.backend.domain.entity.Leave;
import com.ultron.backend.domain.entity.User;
import com.ultron.backend.domain.enums.AttendanceStatus;
import com.ultron.backend.domain.enums.LeaveStatus;
import com.ultron.backend.dto.attendance.*;
import com.ultron.backend.exception.BusinessException;
import com.ultron.backend.repository.AttendanceRepository;
import com.ultron.backend.repository.LeaveRepository;
import com.ultron.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for generating attendance reports and analytics
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AttendanceReportService extends BaseTenantService {

    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final LeaveRepository leaveRepository;
    private final HolidayService holidayService;

    /**
     * Get daily attendance dashboard (real-time)
     */
    @Cacheable(value = "dailyAttendance", key = "#root.target.getCurrentTenantId() + '_' + #date")
    public DailyAttendanceDashboardResponse getDailyDashboard(LocalDate date) {
        String tenantId = getCurrentTenantId();
        log.info("Generating daily dashboard for date: {} in tenant: {}", date, tenantId);

        // Get all active users
        List<User> allUsers = userRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        int totalEmployees = allUsers.size();

        // Get attendance records for the date
        List<Attendance> attendances = attendanceRepository
                .findByTenantIdAndAttendanceDateAndIsDeletedFalse(tenantId, date);

        // Calculate status counts
        Map<AttendanceStatus, Long> statusCounts = attendances.stream()
                .collect(Collectors.groupingBy(Attendance::getStatus, Collectors.counting()));

        int presentCount = statusCounts.getOrDefault(AttendanceStatus.PRESENT, 0L).intValue();
        int lateCount = statusCounts.getOrDefault(AttendanceStatus.LATE, 0L).intValue();
        int absentCount = statusCounts.getOrDefault(AttendanceStatus.ABSENT, 0L).intValue();
        int onLeaveCount = statusCounts.getOrDefault(AttendanceStatus.ON_LEAVE, 0L).intValue();
        int halfDayCount = statusCounts.getOrDefault(AttendanceStatus.HALF_DAY, 0L).intValue();
        int weekOffCount = statusCounts.getOrDefault(AttendanceStatus.WEEK_OFF, 0L).intValue();
        int holidayCount = statusCounts.getOrDefault(AttendanceStatus.HOLIDAY, 0L).intValue();

        int totalWorkingEmployees = totalEmployees - weekOffCount - holidayCount;

        // Check-in/out counts
        long checkedInCount = attendances.stream()
                .filter(a -> a.getCheckInTime() != null && a.getCheckOutTime() == null)
                .count();
        long checkedOutCount = attendances.stream()
                .filter(a -> a.getCheckOutTime() != null)
                .count();
        int notCheckedInCount = totalWorkingEmployees - presentCount - lateCount - onLeaveCount - absentCount;

        // Calculate percentages
        double presentPercentage = totalWorkingEmployees > 0
                ? ((presentCount + lateCount) * 100.0 / totalWorkingEmployees) : 0.0;
        double latePercentage = totalWorkingEmployees > 0
                ? (lateCount * 100.0 / totalWorkingEmployees) : 0.0;
        double absentPercentage = totalWorkingEmployees > 0
                ? (absentCount * 100.0 / totalWorkingEmployees) : 0.0;

        // Work hours statistics
        double averageWorkHours = attendances.stream()
                .filter(a -> a.getTotalWorkMinutes() != null && a.getTotalWorkMinutes() > 0)
                .mapToDouble(a -> a.getTotalWorkMinutes() / 60.0)
                .average()
                .orElse(0.0);

        long overtimeCount = attendances.stream()
                .filter(a -> a.getOvertimeMinutes() != null && a.getOvertimeMinutes() > 0)
                .count();

        double totalOvertimeHours = attendances.stream()
                .filter(a -> a.getOvertimeMinutes() != null)
                .mapToDouble(a -> a.getOvertimeMinutes() / 60.0)
                .sum();

        // Recent activities (last 10)
        List<DailyAttendanceDashboardResponse.RecentActivityDto> recentActivities = attendances.stream()
                .sorted((a1, a2) -> {
                    LocalDateTime t1 = a1.getCheckOutTime() != null ? a1.getCheckOutTime() : a1.getCheckInTime();
                    LocalDateTime t2 = a2.getCheckOutTime() != null ? a2.getCheckOutTime() : a2.getCheckInTime();
                    return t2.compareTo(t1);
                })
                .limit(10)
                .map(a -> DailyAttendanceDashboardResponse.RecentActivityDto.builder()
                        .userId(a.getUserId())
                        .userName(getUserName(allUsers, a.getUserId()))
                        .activity(a.getCheckOutTime() != null ? "CHECKED_OUT" : "CHECKED_IN")
                        .timestamp(formatDateTime(a.getCheckOutTime() != null ? a.getCheckOutTime() : a.getCheckInTime()))
                        .build())
                .collect(Collectors.toList());

        // Department-wise stats (simplified - assuming department field exists)
        Map<String, DailyAttendanceDashboardResponse.DepartmentStatsDto> departmentStats = new HashMap<>();

        return DailyAttendanceDashboardResponse.builder()
                .date(date)
                .totalEmployees(totalEmployees)
                .totalWorkingEmployees(totalWorkingEmployees)
                .presentCount(presentCount)
                .lateCount(lateCount)
                .absentCount(absentCount)
                .onLeaveCount(onLeaveCount)
                .halfDayCount(halfDayCount)
                .weekOffCount(weekOffCount)
                .holidayCount(holidayCount)
                .presentPercentage(Math.round(presentPercentage * 100.0) / 100.0)
                .latePercentage(Math.round(latePercentage * 100.0) / 100.0)
                .absentPercentage(Math.round(absentPercentage * 100.0) / 100.0)
                .notCheckedInCount(notCheckedInCount)
                .checkedInCount((int) checkedInCount)
                .checkedOutCount((int) checkedOutCount)
                .onBreakCount(0) // Can be calculated if break tracking is active
                .averageWorkHours(Math.round(averageWorkHours * 100.0) / 100.0)
                .overtimeCount((int) overtimeCount)
                .totalOvertimeHours(Math.round(totalOvertimeHours * 100.0) / 100.0)
                .recentActivities(recentActivities)
                .departmentStats(departmentStats)
                .build();
    }

    /**
     * Get monthly attendance report for a user
     */
    @Cacheable(value = "monthlyReport", key = "#root.target.getCurrentTenantId() + '_' + #userId + '_' + #year + '_' + #month")
    public MonthlyAttendanceReportResponse getMonthlyReport(String userId, Integer year, Integer month) {
        String tenantId = getCurrentTenantId();
        log.info("Generating monthly report for user: {} year: {} month: {}", userId, year, month);

        // Get user
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new BusinessException("User not found"));

        String userName = user.getFullName() != null ? user.getFullName() :
                (user.getProfile() != null && user.getProfile().getFullName() != null) ?
                        user.getProfile().getFullName() : user.getUsername();

        // Date range
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.plusMonths(1).minusDays(1);

        // Get attendance records
        List<Attendance> attendances = attendanceRepository
                .findByUserIdAndTenantIdAndAttendanceDateBetweenAndIsDeletedFalse(
                        userId, tenantId, startDate, endDate);

        // Get leaves
        List<Leave> leaves = leaveRepository
                .findByUserIdAndTenantIdAndStartDateBetweenAndIsDeletedFalse(
                        userId, tenantId, startDate, endDate);

        // Calculate working days
        int totalWorkingDays = calculateWorkingDays(startDate, endDate);

        // Status counts
        long presentDays = attendances.stream()
                .filter(a -> a.getStatus() == AttendanceStatus.PRESENT)
                .count();
        long lateDays = attendances.stream()
                .filter(a -> a.getStatus() == AttendanceStatus.LATE)
                .count();
        long absentDays = attendances.stream()
                .filter(a -> a.getStatus() == AttendanceStatus.ABSENT)
                .count();
        long halfDays = attendances.stream()
                .filter(a -> a.getStatus() == AttendanceStatus.HALF_DAY)
                .count();
        long leaveDays = attendances.stream()
                .filter(a -> a.getStatus() == AttendanceStatus.ON_LEAVE)
                .count();
        long weekOffs = attendances.stream()
                .filter(a -> a.getStatus() == AttendanceStatus.WEEK_OFF)
                .count();
        long holidays = attendances.stream()
                .filter(a -> a.getStatus() == AttendanceStatus.HOLIDAY)
                .count();

        // Attendance percentage
        double attendancePercentage = totalWorkingDays > 0
                ? ((presentDays + lateDays) * 100.0 / totalWorkingDays) : 0.0;

        // Punctuality percentage
        double punctualityPercentage = (presentDays + lateDays) > 0
                ? (presentDays * 100.0 / (presentDays + lateDays)) : 0.0;

        // Time-based stats
        int totalWorkMinutes = attendances.stream()
                .filter(a -> a.getTotalWorkMinutes() != null)
                .mapToInt(Attendance::getTotalWorkMinutes)
                .sum();
        double averageWorkHoursPerDay = (presentDays + lateDays) > 0
                ? (totalWorkMinutes / 60.0 / (presentDays + lateDays)) : 0.0;

        int totalOvertimeMinutes = attendances.stream()
                .filter(a -> a.getOvertimeMinutes() != null)
                .mapToInt(Attendance::getOvertimeMinutes)
                .sum();

        int totalLateMinutes = attendances.stream()
                .filter(a -> a.getLateMinutes() != null)
                .mapToInt(Attendance::getLateMinutes)
                .sum();

        // Day-wise breakdown
        List<MonthlyAttendanceReportResponse.DayAttendanceDto> dailyAttendance = new ArrayList<>();
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            final LocalDate date = current;
            Attendance att = attendances.stream()
                    .filter(a -> a.getAttendanceDate().equals(date))
                    .findFirst()
                    .orElse(null);

            if (att != null) {
                dailyAttendance.add(MonthlyAttendanceReportResponse.DayAttendanceDto.builder()
                        .date(date)
                        .dayOfWeek(date.getDayOfWeek().toString())
                        .status(att.getStatus().toString())
                        .checkInTime(att.getCheckInTime() != null ? formatTime(att.getCheckInTime()) : null)
                        .checkOutTime(att.getCheckOutTime() != null ? formatTime(att.getCheckOutTime()) : null)
                        .workMinutes(att.getTotalWorkMinutes())
                        .lateMinutes(att.getLateMinutes())
                        .overtimeMinutes(att.getOvertimeMinutes())
                        .isLocationVerified(att.getIsLocationVerified())
                        .build());
            }
            current = current.plusDays(1);
        }

        // Leave breakdown
        Map<String, Integer> leaveTypeBreakdown = leaves.stream()
                .filter(l -> l.getStatus() == LeaveStatus.APPROVED)
                .collect(Collectors.groupingBy(
                        l -> l.getLeaveType().toString(),
                        Collectors.summingInt(l -> l.getBusinessDays())
                ));

        // Performance rating
        String performanceRating = calculatePerformanceRating(attendancePercentage, punctualityPercentage);

        // Remarks
        List<String> remarks = generateRemarks(attendancePercentage, lateDays, absentDays, totalOvertimeMinutes);

        return MonthlyAttendanceReportResponse.builder()
                .userId(userId)
                .userName(userName)
                .userEmail(user.getEmail())
                .year(year)
                .month(month)
                .totalWorkingDays(totalWorkingDays)
                .presentDays((int) presentDays)
                .lateDays((int) lateDays)
                .absentDays((int) absentDays)
                .halfDays((int) halfDays)
                .leaveDays((int) leaveDays)
                .weekOffs((int) weekOffs)
                .holidays((int) holidays)
                .attendancePercentage(Math.round(attendancePercentage * 100.0) / 100.0)
                .punctualityPercentage(Math.round(punctualityPercentage * 100.0) / 100.0)
                .totalWorkMinutes(totalWorkMinutes)
                .averageWorkHoursPerDay(Math.round(averageWorkHoursPerDay * 100.0) / 100.0)
                .totalOvertimeMinutes(totalOvertimeMinutes)
                .totalLateMinutes(totalLateMinutes)
                .dailyAttendance(dailyAttendance)
                .leaveTypeBreakdown(leaveTypeBreakdown)
                .performanceRating(performanceRating)
                .remarks(remarks)
                .build();
    }

    /**
     * Get team attendance (manager view)
     */
    public TeamAttendanceResponse getTeamAttendance(String managerId, LocalDate startDate, LocalDate endDate) {
        String tenantId = getCurrentTenantId();
        log.info("Generating team attendance for manager: {} from {} to {}", managerId, startDate, endDate);

        // Get team members
        List<User> teamMembers = userRepository.findByManagerIdAndTenantIdAndIsDeletedFalse(managerId, tenantId);

        if (teamMembers.isEmpty()) {
            throw new BusinessException("No team members found");
        }

        List<TeamAttendanceResponse.TeamMemberAttendanceDto> teamMemberStats = new ArrayList<>();
        int teamPresentCount = 0;
        int teamAbsentCount = 0;
        int teamOnLeaveCount = 0;

        for (User member : teamMembers) {
            String memberName = member.getFullName() != null ? member.getFullName() :
                    (member.getProfile() != null && member.getProfile().getFullName() != null) ?
                            member.getProfile().getFullName() : member.getUsername();

            List<Attendance> attendances = attendanceRepository
                    .findByUserIdAndTenantIdAndAttendanceDateBetweenAndIsDeletedFalse(
                            member.getId(), tenantId, startDate, endDate);

            int totalDays = calculateWorkingDays(startDate, endDate);
            long presentDays = attendances.stream()
                    .filter(a -> a.getStatus() == AttendanceStatus.PRESENT || a.getStatus() == AttendanceStatus.LATE)
                    .count();
            long lateDays = attendances.stream()
                    .filter(a -> a.getStatus() == AttendanceStatus.LATE)
                    .count();
            long absentDays = attendances.stream()
                    .filter(a -> a.getStatus() == AttendanceStatus.ABSENT)
                    .count();
            long leaveDays = attendances.stream()
                    .filter(a -> a.getStatus() == AttendanceStatus.ON_LEAVE)
                    .count();

            double attendancePercentage = totalDays > 0 ? (presentDays * 100.0 / totalDays) : 0.0;

            double averageWorkHours = attendances.stream()
                    .filter(a -> a.getTotalWorkMinutes() != null && a.getTotalWorkMinutes() > 0)
                    .mapToDouble(a -> a.getTotalWorkMinutes() / 60.0)
                    .average()
                    .orElse(0.0);

            int totalLateMinutes = attendances.stream()
                    .filter(a -> a.getLateMinutes() != null)
                    .mapToInt(Attendance::getLateMinutes)
                    .sum();

            int totalOvertimeMinutes = attendances.stream()
                    .filter(a -> a.getOvertimeMinutes() != null)
                    .mapToInt(Attendance::getOvertimeMinutes)
                    .sum();

            // Today's status if date range includes today
            String todayStatus = null;
            String todayCheckInTime = null;
            String todayCheckOutTime = null;
            boolean isTodayCheckedIn = false;

            if (!startDate.isAfter(LocalDate.now()) && !endDate.isBefore(LocalDate.now())) {
                Optional<Attendance> todayAtt = attendances.stream()
                        .filter(a -> a.getAttendanceDate().equals(LocalDate.now()))
                        .findFirst();
                if (todayAtt.isPresent()) {
                    todayStatus = todayAtt.get().getStatus().toString();
                    todayCheckInTime = todayAtt.get().getCheckInTime() != null
                            ? formatTime(todayAtt.get().getCheckInTime()) : null;
                    todayCheckOutTime = todayAtt.get().getCheckOutTime() != null
                            ? formatTime(todayAtt.get().getCheckOutTime()) : null;
                    isTodayCheckedIn = todayAtt.get().getCheckInTime() != null
                            && todayAtt.get().getCheckOutTime() == null;
                }
            }

            teamMemberStats.add(TeamAttendanceResponse.TeamMemberAttendanceDto.builder()
                    .userId(member.getId())
                    .userName(memberName)
                    .userEmail(member.getEmail())
                    .totalDays(totalDays)
                    .presentDays((int) presentDays)
                    .lateDays((int) lateDays)
                    .absentDays((int) absentDays)
                    .leaveDays((int) leaveDays)
                    .attendancePercentage(Math.round(attendancePercentage * 100.0) / 100.0)
                    .averageWorkHours(Math.round(averageWorkHours * 100.0) / 100.0)
                    .totalLateMinutes(totalLateMinutes)
                    .totalOvertimeMinutes(totalOvertimeMinutes)
                    .todayStatus(todayStatus)
                    .todayCheckInTime(todayCheckInTime)
                    .todayCheckOutTime(todayCheckOutTime)
                    .isTodayCheckedIn(isTodayCheckedIn)
                    .build());

            // Update team counts (for today)
            if (todayStatus != null) {
                if (todayStatus.equals("PRESENT") || todayStatus.equals("LATE")) teamPresentCount++;
                else if (todayStatus.equals("ABSENT")) teamAbsentCount++;
                else if (todayStatus.equals("ON_LEAVE")) teamOnLeaveCount++;
            }
        }

        double teamAttendancePercentage = teamMembers.size() > 0
                ? (teamPresentCount * 100.0 / teamMembers.size()) : 0.0;

        return TeamAttendanceResponse.builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalTeamMembers(teamMembers.size())
                .teamMembers(teamMemberStats)
                .teamAttendancePercentage(Math.round(teamAttendancePercentage * 100.0) / 100.0)
                .teamPresentCount(teamPresentCount)
                .teamAbsentCount(teamAbsentCount)
                .teamOnLeaveCount(teamOnLeaveCount)
                .build();
    }

    // Helper methods

    private int calculateWorkingDays(LocalDate startDate, LocalDate endDate) {
        int workingDays = 0;
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            DayOfWeek dayOfWeek = current.getDayOfWeek();
            if (dayOfWeek != DayOfWeek.SATURDAY && dayOfWeek != DayOfWeek.SUNDAY) {
                if (!holidayService.isHoliday(current)) {
                    workingDays++;
                }
            }
            current = current.plusDays(1);
        }
        return workingDays;
    }

    private String calculatePerformanceRating(double attendancePercentage, double punctualityPercentage) {
        double overallScore = (attendancePercentage + punctualityPercentage) / 2;
        if (overallScore >= 95) return "EXCELLENT";
        if (overallScore >= 85) return "GOOD";
        if (overallScore >= 75) return "AVERAGE";
        return "NEEDS_IMPROVEMENT";
    }

    private List<String> generateRemarks(double attendancePercentage, long lateDays, long absentDays, int totalOvertimeMinutes) {
        List<String> remarks = new ArrayList<>();

        if (attendancePercentage >= 95) {
            remarks.add("Excellent attendance record");
        } else if (attendancePercentage < 75) {
            remarks.add("Attendance needs improvement");
        }

        if (lateDays > 5) {
            remarks.add("Frequent late arrivals detected");
        } else if (lateDays == 0) {
            remarks.add("Always punctual");
        }

        if (absentDays > 3) {
            remarks.add("High absenteeism");
        }

        if (totalOvertimeMinutes > 60 * 10) {
            remarks.add("Significant overtime hours");
        }

        return remarks;
    }

    /**
     * Get user monthly summary (simplified version for quick stats)
     */
    @Cacheable(value = "userAttendanceSummary", key = "#root.target.getCurrentTenantId() + '_' + #userId + '_' + #year + '_' + #month")
    public com.ultron.backend.dto.response.AttendanceSummaryResponse getUserMonthlySummary(String userId, Integer year, Integer month) {
        String tenantId = getCurrentTenantId();
        log.info("Generating monthly summary for user: {} year: {} month: {}", userId, year, month);

        // Get user
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new BusinessException("User not found"));

        String userName = user.getFullName() != null ? user.getFullName() :
                (user.getProfile() != null && user.getProfile().getFullName() != null) ?
                        user.getProfile().getFullName() : user.getUsername();

        // Date range
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        // Get attendance records
        List<Attendance> attendances = attendanceRepository
                .findByUserIdAndTenantIdAndAttendanceDateBetweenAndIsDeletedFalse(
                        userId, tenantId, startDate, endDate);

        // Calculate working days (exclude weekends)
        long workingDays = startDate.datesUntil(endDate.plusDays(1))
                .filter(date -> date.getDayOfWeek() != DayOfWeek.SATURDAY && date.getDayOfWeek() != DayOfWeek.SUNDAY)
                .count();

        // Count by status
        Map<AttendanceStatus, Long> statusCounts = attendances.stream()
                .collect(Collectors.groupingBy(Attendance::getStatus, Collectors.counting()));

        int presentDays = statusCounts.getOrDefault(AttendanceStatus.PRESENT, 0L).intValue();
        int lateDays = statusCounts.getOrDefault(AttendanceStatus.LATE, 0L).intValue();
        int halfDays = statusCounts.getOrDefault(AttendanceStatus.HALF_DAY, 0L).intValue();
        int leaveDays = statusCounts.getOrDefault(AttendanceStatus.ON_LEAVE, 0L).intValue();
        int holidays = statusCounts.getOrDefault(AttendanceStatus.HOLIDAY, 0L).intValue();
        int absentDays = (int) workingDays - presentDays - lateDays - halfDays - leaveDays - holidays;

        // Time statistics
        int totalWorkMinutes = attendances.stream()
                .filter(a -> a.getTotalWorkMinutes() != null)
                .mapToInt(Attendance::getTotalWorkMinutes)
                .sum();
        int totalWorkHours = totalWorkMinutes / 60;

        int totalOvertimeMinutes = attendances.stream()
                .filter(a -> a.getOvertimeMinutes() != null)
                .mapToInt(Attendance::getOvertimeMinutes)
                .sum();
        int totalOvertimeHours = totalOvertimeMinutes / 60;

        int totalLateMinutes = attendances.stream()
                .filter(a -> a.getLateMinutes() != null)
                .mapToInt(Attendance::getLateMinutes)
                .sum();

        int avgWorkHours = (presentDays + lateDays) > 0 ? totalWorkHours / (presentDays + lateDays) : 0;

        // Attendance percentage
        double attendancePercentage = workingDays > 0
                ? ((presentDays + lateDays + halfDays) * 100.0 / workingDays) : 0.0;

        return com.ultron.backend.dto.response.AttendanceSummaryResponse.builder()
                .userId(userId)
                .userName(userName)
                .startDate(startDate)
                .endDate(endDate)
                .presentDays(presentDays)
                .absentDays(Math.max(0, absentDays))
                .lateDays(lateDays)
                .halfDays(halfDays)
                .leaveDays(leaveDays)
                .holidays(holidays)
                .workingDays((int) workingDays)
                .totalWorkHours(totalWorkHours)
                .averageWorkHours(avgWorkHours)
                .totalOvertimeHours(totalOvertimeHours)
                .totalLateMinutes(totalLateMinutes)
                .attendancePercentage(attendancePercentage)
                .build();
    }

    /**
     * Get detailed daily attendance list for all team members
     */
    public List<DetailedDailyAttendanceDto> getDetailedDailyAttendance(LocalDate date) {
        String tenantId = getCurrentTenantId();
        log.info("Fetching detailed daily attendance for date: {} in tenant: {}", date, tenantId);

        // Get all active users
        List<User> allUsers = userRepository.findByTenantIdAndIsDeletedFalse(tenantId);

        // Get attendance records for the date
        List<Attendance> attendances = attendanceRepository
                .findByTenantIdAndAttendanceDateAndIsDeletedFalse(tenantId, date);

        // Create a map of userId -> attendance for quick lookup
        Map<String, Attendance> attendanceMap = attendances.stream()
                .collect(Collectors.toMap(Attendance::getUserId, a -> a, (a1, a2) -> a1));

        // Build response for each user
        return allUsers.stream()
                .map(user -> {
                    Attendance att = attendanceMap.get(user.getId());

                    return DetailedDailyAttendanceDto.builder()
                            .userId(user.getId())
                            .userName(user.getFullName() != null ? user.getFullName() :
                                    (user.getProfile() != null && user.getProfile().getFullName() != null) ?
                                            user.getProfile().getFullName() : user.getUsername())
                            .userEmail(user.getEmail())
                            .department(user.getProfile() != null ? user.getProfile().getDepartment() : null)
                            .attendanceId(att != null ? att.getAttendanceId() : null)
                            .status(att != null ? att.getStatus().toString() : "ABSENT")
                            .checkInTime(att != null && att.getCheckInTime() != null ?
                                    formatDateTime(att.getCheckInTime()) : null)
                            .checkOutTime(att != null && att.getCheckOutTime() != null ?
                                    formatDateTime(att.getCheckOutTime()) : null)
                            .type(att != null && att.getType() != null ? att.getType().toString() : null)
                            .totalWorkMinutes(att != null ? att.getTotalWorkMinutes() : null)
                            .lateMinutes(att != null ? att.getLateMinutes() : null)
                            .overtimeMinutes(att != null ? att.getOvertimeMinutes() : null)
                            .isLocationVerified(att != null ? att.getIsLocationVerified() : null)
                            .locationValidationMessage(att != null ? att.getLocationValidationMessage() : null)
                            .checkInLatitude(att != null && att.getCheckInLocation() != null ?
                                    att.getCheckInLocation().getLatitude() : null)
                            .checkInLongitude(att != null && att.getCheckInLocation() != null ?
                                    att.getCheckInLocation().getLongitude() : null)
                            .checkInAddress(att != null && att.getCheckInLocation() != null ?
                                    att.getCheckInLocation().getAddress() : null)
                            .breaks(null) // Simplified - not mapping breaks for now
                            .build();
                })
                .collect(Collectors.toList());
    }

    private String getUserName(List<User> users, String userId) {
        return users.stream()
                .filter(u -> u.getId().equals(userId))
                .map(u -> u.getFullName() != null ? u.getFullName() :
                        (u.getProfile() != null && u.getProfile().getFullName() != null) ?
                                u.getProfile().getFullName() : u.getUsername())
                .findFirst()
                .orElse("Unknown");
    }

    private String formatDateTime(LocalDateTime dateTime) {
        return dateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }

    private String formatTime(LocalDateTime dateTime) {
        return dateTime.format(DateTimeFormatter.ofPattern("HH:mm"));
    }
}
