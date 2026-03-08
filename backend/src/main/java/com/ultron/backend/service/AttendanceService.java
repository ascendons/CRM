package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Attendance;
import com.ultron.backend.domain.entity.OfficeLocation;
import com.ultron.backend.domain.entity.Shift;
import com.ultron.backend.domain.entity.User;
import com.ultron.backend.domain.enums.AttendanceStatus;
import com.ultron.backend.domain.enums.AttendanceType;
import com.ultron.backend.dto.request.BreakEndRequest;
import com.ultron.backend.dto.request.BreakStartRequest;
import com.ultron.backend.dto.request.CheckInRequest;
import com.ultron.backend.dto.request.CheckOutRequest;
import com.ultron.backend.dto.response.*;
import com.ultron.backend.exception.BusinessException;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.AttendanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for attendance management with GPS verification
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AttendanceService extends BaseTenantService {

    private final AttendanceRepository attendanceRepository;
    private final AttendanceIdGeneratorService idGenerator;
    private final UserService userService;
    private final com.ultron.backend.repository.UserRepository userRepository;
    private final ShiftService shiftService;
    private final OfficeLocationService officeLocationService;
    private final NotificationService notificationService;
    private final com.ultron.backend.util.GpsSpoofingDetector gpsSpoofingDetector;

    /**
     * Check in user with GPS verification
     */
    @Caching(evict = {
        @CacheEvict(value = "dailyAttendance",
                    key = "T(com.ultron.backend.multitenancy.TenantContext).getTenantId() + '_' + T(java.time.LocalDate).now()"),
        @CacheEvict(value = "userAttendanceSummary", allEntries = true)
    })
    public AttendanceResponse checkIn(CheckInRequest request, String userId) {
        String tenantId = getCurrentTenantId();
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        log.info("Check-in request for user {} at location ({}, {})", userId, request.getLatitude(), request.getLongitude());

        // 1. Validate: No existing check-in today
        Optional<Attendance> existing = attendanceRepository
            .findByUserIdAndAttendanceDateAndTenantIdAndIsDeletedFalse(userId, today, tenantId);

        if (existing.isPresent()) {
            throw new BusinessException("You have already checked in today at " + existing.get().getCheckInTime());
        }

        // 2. Get user details
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String userName = user.getFullName() != null ? user.getFullName() :
                (user.getProfile() != null && user.getProfile().getFullName() != null) ?
                        user.getProfile().getFullName() : user.getUsername();

        // 3. Get user shift
        Shift shift = shiftService.getUserActiveShift(userId);
        if (shift == null) {
            shift = shiftService.getDefaultShift();
            if (shift == null) {
                throw new BusinessException("No shift configured. Please contact admin.");
            }
        }

        // 4. Get office location for OFFICE type
        OfficeLocation officeLocation = null;
        if (request.getType() == AttendanceType.OFFICE) {
            String locationId = request.getOfficeLocationId();
            if (locationId == null) {
                // Get default/assigned location
                locationId = shiftService.getUserOfficeLocationId(userId);
            }
            if (locationId != null) {
                officeLocation = officeLocationService.getLocationById(locationId);
            } else {
                throw new BusinessException("Office location not specified for OFFICE check-in");
            }
        }

        // 5. GPS Verification
        boolean isLocationVerified = false;
        String validationMessage = "";

        if (request.getType() == AttendanceType.OFFICE && officeLocation != null) {
            double distance = calculateDistance(
                request.getLatitude(), request.getLongitude(),
                officeLocation.getLatitude(), officeLocation.getLongitude()
            );

            isLocationVerified = distance <= officeLocation.getRadiusMeters();

            if (!isLocationVerified) {
                validationMessage = String.format(
                    "You are %.0f meters away from office. Allowed: %d meters",
                    distance, officeLocation.getRadiusMeters()
                );

                if (officeLocation.getEnforceGeofence() && !officeLocation.getAllowManualOverride()) {
                    throw new BusinessException("You must be within office geofence to check in. " + validationMessage);
                }
            } else {
                validationMessage = "Location verified successfully";
            }
        } else if (request.getType() == AttendanceType.REMOTE || request.getType() == AttendanceType.FIELD) {
            isLocationVerified = true;
            validationMessage = "Remote/Field work - location tracking enabled";
        }

        // 5.5. GPS Spoofing Detection
        var spoofingResult = gpsSpoofingDetector.detectSpoofing(userId, request);
        if (spoofingResult.isSuspicious()) {
            log.warn("GPS spoofing detected for user {}: {}", userId, spoofingResult.getSummary());

            // Add to validation message
            validationMessage += " | Warning: " + spoofingResult.getSummary();

            // If HIGH likelihood, send alert to admin/manager
            if (spoofingResult.getLikelihood() == com.ultron.backend.util.GpsSpoofingDetector.SpoofingLikelihood.HIGH) {
                if (user.getManagerId() != null) {
                    notificationService.createAndSendNotification(
                            user.getManagerId(),
                            "GPS Spoofing Alert",
                            String.format("%s's check-in shows signs of GPS spoofing. Score: %d. Indicators: %s",
                                    userName, spoofingResult.getSuspicionScore(),
                                    String.join(", ", spoofingResult.getIndicators())),
                            "GPS_SPOOFING_ALERT",
                            "/admin/attendance/daily"
                    );
                }
            }
        }

        // 6. Calculate late arrival
        LocalTime checkInTime = now.toLocalTime();
        Integer lateMinutes = 0;
        AttendanceStatus status = AttendanceStatus.PRESENT;

        LocalTime expectedStartTime = shift.getStartTime();
        LocalTime graceEndTime = expectedStartTime.plusMinutes(shift.getGraceMinutes() != null ? shift.getGraceMinutes() : 0);

        if (checkInTime.isAfter(graceEndTime)) {
            lateMinutes = (int) Duration.between(expectedStartTime, checkInTime).toMinutes();
            status = AttendanceStatus.LATE;
        }

        // 7. Create attendance record
        Attendance attendance = Attendance.builder()
            .attendanceId(idGenerator.generateAttendanceId())
            .tenantId(tenantId)
            .userId(userId)
            .userName(user.getProfile() != null ? user.getProfile().getFullName() : user.getFullName())
            .userEmail(user.getEmail())
            .department(user.getProfile() != null ? user.getProfile().getDepartment() : null)
            .attendanceDate(today)
            .checkInTime(now)
            .checkInLocation(buildLocationFromRequest(request))
            .checkInDeviceInfo(request.getDeviceInfo())
            .checkInIpAddress(null) // Set from request context if available
            .type(request.getType())
            .status(status)
            .lateMinutes(lateMinutes)
            .shiftId(shift.getShiftId())
            .shiftName(shift.getName())
            .expectedStartTime(shift.getStartTime())
            .expectedEndTime(shift.getEndTime())
            .isLocationVerified(isLocationVerified)
            .locationValidationMessage(validationMessage)
            .requiresApproval(!isLocationVerified && officeLocation != null)
            .officeLocationId(officeLocation != null ? officeLocation.getLocationId() : null)
            .officeLocationName(officeLocation != null ? officeLocation.getName() : null)
            .breaks(new ArrayList<>())
            .userNotes(request.getUserNotes())
            .createdAt(now)
            .createdBy(userId)
            .isDeleted(false)
            .build();

        attendance = attendanceRepository.save(attendance);

        log.info("✅ Check-in successful for user {} - Status: {}, Late: {} minutes",
                 userId, status, lateMinutes);

        // 8. Notifications
        if (status == AttendanceStatus.LATE && user.getManagerId() != null) {
            notificationService.createAndSendNotification(
                user.getManagerId(),
                "Late Arrival Alert",
                String.format("%s checked in %d minutes late today",
                              user.getProfile() != null ? user.getProfile().getFullName() : user.getFullName(),
                              lateMinutes),
                "ATTENDANCE_LATE",
                "/admin/attendance/daily"
            );
        }

        if (!isLocationVerified && officeLocation != null && officeLocation.getEnforceGeofence()) {
            notificationService.createAndSendNotification(
                userId,
                "Location Verification Required",
                "Your check-in location could not be verified. Please check with your manager.",
                "ATTENDANCE_LOCATION_MISMATCH",
                "/attendance"
            );
        }

        return mapToResponse(attendance);
    }

    /**
     * Check out user
     */
    @Caching(evict = {
        @CacheEvict(value = "dailyAttendance",
                    key = "T(com.ultron.backend.multitenancy.TenantContext).getTenantId() + '_' + T(java.time.LocalDate).now()"),
        @CacheEvict(value = "userAttendanceSummary", allEntries = true)
    })
    public AttendanceResponse checkOut(CheckOutRequest request, String userId) {
        String tenantId = getCurrentTenantId();
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();

        log.info("Check-out request for user {} at location ({}, {})", userId, request.getLatitude(), request.getLongitude());

        // 1. Find today's attendance by userId + date (more robust than attendanceId)
        Attendance attendance = attendanceRepository
            .findByUserIdAndAttendanceDateAndTenantIdAndIsDeletedFalse(userId, today, tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("No attendance record found for today. Please check in first."));

        // Validate already checked out
        if (attendance.getCheckOutTime() != null) {
            throw new BusinessException("You have already checked out at " + attendance.getCheckOutTime());
        }

        // 2. Update checkout details
        attendance.setCheckOutTime(now);
        attendance.setCheckOutLocation(buildLocationFromCheckout(request));
        attendance.setCheckOutDeviceInfo(request.getDeviceInfo());
        attendance.setLastModifiedAt(now);
        attendance.setLastModifiedBy(userId);

        // 3. Calculate total work time
        long totalMinutes = Duration.between(attendance.getCheckInTime(), now).toMinutes();
        int breakMinutes = attendance.getTotalBreakMinutes() != null ? attendance.getTotalBreakMinutes() : 0;
        int netWorkMinutes = (int) totalMinutes - breakMinutes;

        attendance.setTotalWorkMinutes(netWorkMinutes);

        // 4. Get shift for calculations
        Shift shift = shiftService.getShiftById(attendance.getShiftId());
        if (shift != null) {
            int expectedWorkMinutes = shift.getWorkHoursMinutes();
            int regularMinutes = Math.min(netWorkMinutes, expectedWorkMinutes);
            int overtimeMinutes = Math.max(0, netWorkMinutes - expectedWorkMinutes);

            attendance.setRegularMinutes(regularMinutes);
            attendance.setOvertimeMinutes(overtimeMinutes);

            // Check for early leave
            LocalTime checkOutTime = now.toLocalTime();
            LocalTime expectedEndTime = shift.getEndTime();

            if (checkOutTime.isBefore(expectedEndTime)) {
                int earlyMinutes = (int) Duration.between(checkOutTime, expectedEndTime).toMinutes();
                attendance.setEarlyLeaveMinutes(earlyMinutes);

                // Update status if left too early
                if (earlyMinutes > 60) { // More than 1 hour early
                    attendance.setStatus(AttendanceStatus.HALF_DAY);
                }
            }
        }

        // 5. Set final status
        if (attendance.getStatus() != AttendanceStatus.HALF_DAY) {
            if (attendance.getLateMinutes() != null && attendance.getLateMinutes() > 0) {
                attendance.setStatus(AttendanceStatus.LATE);
            } else {
                attendance.setStatus(AttendanceStatus.PRESENT);
            }
        }

        // Add user notes
        if (request.getUserNotes() != null) {
            attendance.setUserNotes(attendance.getUserNotes() != null
                ? attendance.getUserNotes() + "\n" + request.getUserNotes()
                : request.getUserNotes());
        }

        attendance = attendanceRepository.save(attendance);

        log.info("✅ Check-out successful for user {} - Total work: {} minutes, Overtime: {} minutes",
                 userId, netWorkMinutes, attendance.getOvertimeMinutes());

        // 6. Notifications
        User user = userRepository.findByIdAndTenantId(userId, tenantId).orElse(null);
        if (attendance.getEarlyLeaveMinutes() != null && attendance.getEarlyLeaveMinutes() > 30
            && user != null && user.getManagerId() != null) {
            notificationService.createAndSendNotification(
                user.getManagerId(),
                "Early Leave Alert",
                String.format("%s left %d minutes early today",
                              user.getProfile() != null ? user.getProfile().getFullName() : user.getFullName(),
                              attendance.getEarlyLeaveMinutes()),
                "ATTENDANCE_EARLY_LEAVE",
                "/admin/attendance/daily"
            );
        }

        return mapToResponse(attendance);
    }

    /**
     * Start break
     */
    public AttendanceResponse startBreak(BreakStartRequest request, String userId) {
        String tenantId = getCurrentTenantId();
        LocalDateTime now = LocalDateTime.now();

        Attendance attendance = attendanceRepository
            .findByAttendanceIdAndTenantId(request.getAttendanceId(), tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found"));

        if (!attendance.getUserId().equals(userId)) {
            throw new BusinessException("This attendance record does not belong to you");
        }

        if (attendance.getCheckOutTime() != null) {
            throw new BusinessException("Cannot start break after check-out");
        }

        // Check for ongoing break
        if (attendance.getBreaks() != null) {
            boolean hasOngoingBreak = attendance.getBreaks().stream()
                .anyMatch(b -> b.getEndTime() == null);
            if (hasOngoingBreak) {
                throw new BusinessException("You have an ongoing break. Please end it first.");
            }
        }

        // Create break record
        Attendance.BreakRecord breakRecord = Attendance.BreakRecord.builder()
            .breakId("BRK-" + System.currentTimeMillis())
            .startTime(now)
            .type(request.getType())
            .startLocation(request.getLatitude() != null ?
                Attendance.AttendanceLocation.builder()
                    .latitude(request.getLatitude())
                    .longitude(request.getLongitude())
                    .accuracy(request.getAccuracy())
                    .build() : null)
            .build();

        if (attendance.getBreaks() == null) {
            attendance.setBreaks(new ArrayList<>());
        }
        attendance.getBreaks().add(breakRecord);
        attendance.setLastModifiedAt(now);
        attendance.setLastModifiedBy(userId);

        attendance = attendanceRepository.save(attendance);

        log.info("Break started for user {} - Type: {}", userId, request.getType());

        return mapToResponse(attendance);
    }

    /**
     * End break
     */
    public AttendanceResponse endBreak(BreakEndRequest request, String userId) {
        String tenantId = getCurrentTenantId();
        LocalDateTime now = LocalDateTime.now();

        Attendance attendance = attendanceRepository
            .findByAttendanceIdAndTenantId(request.getAttendanceId(), tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found"));

        if (!attendance.getUserId().equals(userId)) {
            throw new BusinessException("This attendance record does not belong to you");
        }

        // Find the break
        Attendance.BreakRecord breakRecord = attendance.getBreaks().stream()
            .filter(b -> b.getBreakId().equals(request.getBreakId()))
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException("Break record not found"));

        if (breakRecord.getEndTime() != null) {
            throw new BusinessException("This break has already been ended");
        }

        // End break
        breakRecord.setEndTime(now);
        breakRecord.setDurationMinutes((int) Duration.between(breakRecord.getStartTime(), now).toMinutes());

        if (request.getLatitude() != null) {
            breakRecord.setEndLocation(Attendance.AttendanceLocation.builder()
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .accuracy(request.getAccuracy())
                .build());
        }

        // Update total break minutes
        int totalBreakMinutes = attendance.getBreaks().stream()
            .filter(b -> b.getDurationMinutes() != null)
            .mapToInt(Attendance.BreakRecord::getDurationMinutes)
            .sum();
        attendance.setTotalBreakMinutes(totalBreakMinutes);
        attendance.setLastModifiedAt(now);
        attendance.setLastModifiedBy(userId);

        attendance = attendanceRepository.save(attendance);

        log.info("Break ended for user {} - Duration: {} minutes", userId, breakRecord.getDurationMinutes());

        return mapToResponse(attendance);
    }

    /**
     * Get today's attendance for user
     */
    public AttendanceResponse getTodayAttendance(String userId) {
        String tenantId = getCurrentTenantId();
        LocalDate today = LocalDate.now();

        Optional<Attendance> attendance = attendanceRepository
            .findByUserIdAndAttendanceDateAndTenantIdAndIsDeletedFalse(userId, today, tenantId);

        return attendance.map(this::mapToResponse).orElse(null);
    }

    /**
     * Get user attendance history
     */
    public List<AttendanceResponse> getUserAttendance(String userId, LocalDate startDate, LocalDate endDate) {
        String tenantId = getCurrentTenantId();

        List<Attendance> attendances = attendanceRepository
            .findByUserIdAndTenantIdAndAttendanceDateBetweenAndIsDeletedFalse(userId, tenantId, startDate, endDate);

        return attendances.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    /**
     * Get daily dashboard (Admin)
     */
    @Cacheable(value = "dailyAttendance",
               key = "#tenantId + '_' + #date",
               unless = "#result == null")
    public DailyAttendanceDashboardResponse getDailyDashboard(LocalDate date) {
        String tenantId = getCurrentTenantId();

        List<Attendance> attendances = attendanceRepository
            .findByTenantIdAndAttendanceDateAndIsDeletedFalse(tenantId, date);

        // Get all active users
        List<User> allUsers = userRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        int totalEmployees = allUsers.size();

        // Calculate statistics
        int presentCount = (int) attendances.stream().filter(a ->
            a.getStatus() == AttendanceStatus.PRESENT || a.getStatus() == AttendanceStatus.LATE).count();
        int lateCount = (int) attendances.stream().filter(a -> a.getStatus() == AttendanceStatus.LATE).count();
        int onLeaveCount = (int) attendances.stream().filter(a -> a.getStatus() == AttendanceStatus.ON_LEAVE).count();
        int remoteCount = (int) attendances.stream().filter(a -> a.getType() == AttendanceType.REMOTE).count();
        int officeCount = (int) attendances.stream().filter(a -> a.getType() == AttendanceType.OFFICE).count();
        int fieldCount = (int) attendances.stream().filter(a -> a.getType() == AttendanceType.FIELD).count();
        int notCheckedInCount = totalEmployees - attendances.size();
        int absentCount = notCheckedInCount - onLeaveCount;

        return DailyAttendanceDashboardResponse.builder()
            .date(date)
            .totalEmployees(totalEmployees)
            .presentCount(presentCount)
            .absentCount(absentCount)
            .lateCount(lateCount)
            .onLeaveCount(onLeaveCount)
            .remoteCount(remoteCount)
            .officeCount(officeCount)
            .fieldCount(fieldCount)
            .notCheckedInCount(notCheckedInCount)
            .build();
    }

    /**
     * Calculate distance between two GPS coordinates using Haversine formula
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371000; // Earth radius in meters

        double φ1 = Math.toRadians(lat1);
        double φ2 = Math.toRadians(lat2);
        double Δφ = Math.toRadians(lat2 - lat1);
        double Δλ = Math.toRadians(lon2 - lon1);

        double a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                   Math.cos(φ1) * Math.cos(φ2) *
                   Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }

    /**
     * Build location from check-in request
     */
    private Attendance.AttendanceLocation buildLocationFromRequest(CheckInRequest request) {
        return Attendance.AttendanceLocation.builder()
            .latitude(request.getLatitude())
            .longitude(request.getLongitude())
            .address(request.getAddress())
            .accuracy(request.getAccuracy())
            .isGpsSpoofingDetected(false) // TODO: Implement spoofing detection
            .build();
    }

    /**
     * Build location from check-out request
     */
    private Attendance.AttendanceLocation buildLocationFromCheckout(CheckOutRequest request) {
        return Attendance.AttendanceLocation.builder()
            .latitude(request.getLatitude())
            .longitude(request.getLongitude())
            .address(request.getAddress())
            .accuracy(request.getAccuracy())
            .isGpsSpoofingDetected(false)
            .build();
    }

    /**
     * Map entity to response DTO
     */
    private AttendanceResponse mapToResponse(Attendance attendance) {
        return AttendanceResponse.builder()
            .id(attendance.getId())
            .attendanceId(attendance.getAttendanceId())
            .userId(attendance.getUserId())
            .userName(attendance.getUserName())
            .userEmail(attendance.getUserEmail())
            .department(attendance.getDepartment())
            .attendanceDate(attendance.getAttendanceDate())
            .checkInTime(attendance.getCheckInTime())
            .checkOutTime(attendance.getCheckOutTime())
            .checkInLocation(mapLocationToDTO(attendance.getCheckInLocation()))
            .checkOutLocation(mapLocationToDTO(attendance.getCheckOutLocation()))
            .type(attendance.getType())
            .status(attendance.getStatus())
            .totalWorkMinutes(attendance.getTotalWorkMinutes())
            .regularMinutes(attendance.getRegularMinutes())
            .overtimeMinutes(attendance.getOvertimeMinutes())
            .lateMinutes(attendance.getLateMinutes())
            .earlyLeaveMinutes(attendance.getEarlyLeaveMinutes())
            .breaks(mapBreaksToDTO(attendance.getBreaks()))
            .totalBreakMinutes(attendance.getTotalBreakMinutes())
            .shiftId(attendance.getShiftId())
            .shiftName(attendance.getShiftName())
            .expectedStartTime(attendance.getExpectedStartTime())
            .expectedEndTime(attendance.getExpectedEndTime())
            .leaveId(attendance.getLeaveId())
            .leaveType(attendance.getLeaveType())
            .officeLocationId(attendance.getOfficeLocationId())
            .officeLocationName(attendance.getOfficeLocationName())
            .isLocationVerified(attendance.getIsLocationVerified())
            .locationValidationMessage(attendance.getLocationValidationMessage())
            .requiresApproval(attendance.getRequiresApproval())
            .approvedBy(attendance.getApprovedBy())
            .approvedAt(attendance.getApprovedAt())
            .userNotes(attendance.getUserNotes())
            .managerNotes(attendance.getManagerNotes())
            .systemNotes(attendance.getSystemNotes())
            .createdAt(attendance.getCreatedAt())
            .createdBy(attendance.getCreatedBy())
            .lastModifiedAt(attendance.getLastModifiedAt())
            .lastModifiedBy(attendance.getLastModifiedBy())
            .build();
    }

    private AttendanceLocationDTO mapLocationToDTO(Attendance.AttendanceLocation location) {
        if (location == null) return null;
        return AttendanceLocationDTO.builder()
            .latitude(location.getLatitude())
            .longitude(location.getLongitude())
            .address(location.getAddress())
            .accuracy(location.getAccuracy())
            .isGpsSpoofingDetected(location.getIsGpsSpoofingDetected())
            .build();
    }

    private List<BreakRecordDTO> mapBreaksToDTO(List<Attendance.BreakRecord> breaks) {
        if (breaks == null) return new ArrayList<>();
        return breaks.stream()
            .map(b -> BreakRecordDTO.builder()
                .breakId(b.getBreakId())
                .startTime(b.getStartTime())
                .endTime(b.getEndTime())
                .durationMinutes(b.getDurationMinutes())
                .type(b.getType())
                .startLocation(mapLocationToDTO(b.getStartLocation()))
                .endLocation(mapLocationToDTO(b.getEndLocation()))
                .build())
            .collect(Collectors.toList());
    }
}
