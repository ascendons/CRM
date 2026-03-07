package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Shift;
import com.ultron.backend.dto.request.CreateShiftRequest;
import com.ultron.backend.dto.request.UpdateShiftRequest;
import com.ultron.backend.dto.response.ShiftResponse;
import com.ultron.backend.exception.BusinessException;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.ShiftRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for shift management
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ShiftService extends BaseTenantService {

    private final ShiftRepository shiftRepository;
    private final ShiftIdGeneratorService idGenerator;

    /**
     * Create new shift
     */
    @CacheEvict(value = "shifts", allEntries = true)
    public ShiftResponse createShift(CreateShiftRequest request) {
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();

        log.info("Creating shift: {} for tenant: {}", request.getName(), tenantId);

        // Check for duplicate code
        if (shiftRepository.findByCodeAndTenantIdAndIsDeletedFalse(request.getCode(), tenantId).isPresent()) {
            throw new BusinessException("Shift with code '" + request.getCode() + "' already exists");
        }

        // If setting as default, remove default flag from existing shifts
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            shiftRepository.findByTenantIdAndIsDefaultTrueAndIsDeletedFalse(tenantId)
                .ifPresent(existingDefault -> {
                    existingDefault.setIsDefault(false);
                    shiftRepository.save(existingDefault);
                });
        }

        Shift shift = Shift.builder()
            .shiftId(idGenerator.generateShiftId())
            .tenantId(tenantId)
            .name(request.getName())
            .description(request.getDescription())
            .code(request.getCode())
            .startTime(request.getStartTime())
            .endTime(request.getEndTime())
            .workHoursMinutes(request.getWorkHoursMinutes())
            .type(request.getType())
            .graceMinutes(request.getGraceMinutes())
            .flexibleStartMinutes(request.getFlexibleStartMinutes())
            .flexibleEndMinutes(request.getFlexibleEndMinutes())
            .mandatoryBreakMinutes(request.getMandatoryBreakMinutes())
            .maxBreakMinutes(request.getMaxBreakMinutes())
            .workingDays(request.getWorkingDays())
            .weekendDays(request.getWeekendDays())
            .allowOvertime(request.getAllowOvertime())
            .maxOvertimeMinutesPerDay(request.getMaxOvertimeMinutesPerDay())
            .minOvertimeMinutes(request.getMinOvertimeMinutes())
            .isDefault(request.getIsDefault() != null ? request.getIsDefault() : false)
            .isActive(request.getIsActive() != null ? request.getIsActive() : true)
            .createdAt(LocalDateTime.now())
            .createdBy(userId)
            .isDeleted(false)
            .build();

        shift = shiftRepository.save(shift);

        log.info("✅ Shift created: {} ({})", shift.getName(), shift.getShiftId());

        return mapToResponse(shift);
    }

    /**
     * Update shift
     */
    @CacheEvict(value = "shifts", allEntries = true)
    public ShiftResponse updateShift(String id, UpdateShiftRequest request) {
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();

        Shift shift = shiftRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Shift not found"));

        validateResourceTenantOwnership(shift.getTenantId());

        // Check for duplicate code if changing
        if (request.getCode() != null && !request.getCode().equals(shift.getCode())) {
            if (shiftRepository.findByCodeAndTenantIdAndIsDeletedFalse(request.getCode(), tenantId).isPresent()) {
                throw new BusinessException("Shift with code '" + request.getCode() + "' already exists");
            }
            shift.setCode(request.getCode());
        }

        // If setting as default, remove default flag from existing shifts
        if (Boolean.TRUE.equals(request.getIsDefault()) && !Boolean.TRUE.equals(shift.getIsDefault())) {
            shiftRepository.findByTenantIdAndIsDefaultTrueAndIsDeletedFalse(tenantId)
                .ifPresent(existingDefault -> {
                    existingDefault.setIsDefault(false);
                    shiftRepository.save(existingDefault);
                });
        }

        // Update fields
        if (request.getName() != null) shift.setName(request.getName());
        if (request.getDescription() != null) shift.setDescription(request.getDescription());
        if (request.getStartTime() != null) shift.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) shift.setEndTime(request.getEndTime());
        if (request.getWorkHoursMinutes() != null) shift.setWorkHoursMinutes(request.getWorkHoursMinutes());
        if (request.getType() != null) shift.setType(request.getType());
        if (request.getGraceMinutes() != null) shift.setGraceMinutes(request.getGraceMinutes());
        if (request.getFlexibleStartMinutes() != null) shift.setFlexibleStartMinutes(request.getFlexibleStartMinutes());
        if (request.getFlexibleEndMinutes() != null) shift.setFlexibleEndMinutes(request.getFlexibleEndMinutes());
        if (request.getMandatoryBreakMinutes() != null) shift.setMandatoryBreakMinutes(request.getMandatoryBreakMinutes());
        if (request.getMaxBreakMinutes() != null) shift.setMaxBreakMinutes(request.getMaxBreakMinutes());
        if (request.getWorkingDays() != null) shift.setWorkingDays(request.getWorkingDays());
        if (request.getWeekendDays() != null) shift.setWeekendDays(request.getWeekendDays());
        if (request.getAllowOvertime() != null) shift.setAllowOvertime(request.getAllowOvertime());
        if (request.getMaxOvertimeMinutesPerDay() != null) shift.setMaxOvertimeMinutesPerDay(request.getMaxOvertimeMinutesPerDay());
        if (request.getMinOvertimeMinutes() != null) shift.setMinOvertimeMinutes(request.getMinOvertimeMinutes());
        if (request.getIsDefault() != null) shift.setIsDefault(request.getIsDefault());
        if (request.getIsActive() != null) shift.setIsActive(request.getIsActive());

        shift.setLastModifiedAt(LocalDateTime.now());
        shift.setLastModifiedBy(userId);

        shift = shiftRepository.save(shift);

        log.info("✅ Shift updated: {} ({})", shift.getName(), shift.getShiftId());

        return mapToResponse(shift);
    }

    /**
     * Delete shift (soft delete)
     */
    @CacheEvict(value = "shifts", allEntries = true)
    public void deleteShift(String id) {
        String userId = getCurrentUserId();

        Shift shift = shiftRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Shift not found"));

        validateResourceTenantOwnership(shift.getTenantId());

        if (Boolean.TRUE.equals(shift.getIsDefault())) {
            throw new BusinessException("Cannot delete default shift. Please set another shift as default first.");
        }

        shift.setIsDeleted(true);
        shift.setLastModifiedAt(LocalDateTime.now());
        shift.setLastModifiedBy(userId);

        shiftRepository.save(shift);

        log.info("✅ Shift deleted: {} ({})", shift.getName(), shift.getShiftId());
    }

    /**
     * Get shift by ID
     */
    @Cacheable(value = "shifts", key = "#id")
    public ShiftResponse getShiftResponseById(String id) {
        Shift shift = shiftRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Shift not found"));

        validateResourceTenantOwnership(shift.getTenantId());

        return mapToResponse(shift);
    }

    /**
     * Get shift entity by shiftId (for internal use)
     */
    public Shift getShiftById(String shiftId) {
        String tenantId = getCurrentTenantId();
        return shiftRepository.findFirstByShiftIdAndTenantId(shiftId, tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Shift not found: " + shiftId));
    }

    /**
     * Get all shifts for tenant
     */
    @Cacheable(value = "shifts", key = "#tenantId + '_all'")
    public List<ShiftResponse> getAllShifts() {
        String tenantId = getCurrentTenantId();

        List<Shift> shifts = shiftRepository.findByTenantIdAndIsDeletedFalse(tenantId);

        return shifts.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    /**
     * Get active shifts only
     */
    public List<ShiftResponse> getActiveShifts() {
        String tenantId = getCurrentTenantId();

        List<Shift> shifts = shiftRepository.findByTenantIdAndIsActiveTrueAndIsDeletedFalse(tenantId);

        return shifts.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    /**
     * Get default shift
     */
    public Shift getDefaultShift() {
        String tenantId = getCurrentTenantId();
        return shiftRepository.findByTenantIdAndIsDefaultTrueAndIsDeletedFalse(tenantId)
            .orElse(null);
    }

    /**
     * Get user's active shift (stub - to be implemented with UserShiftAssignment)
     */
    public Shift getUserActiveShift(String userId) {
        // TODO: Implement with UserShiftAssignment table
        // For now, return default shift
        return getDefaultShift();
    }

    /**
     * Get user's office location ID (stub - to be implemented with UserShiftAssignment)
     */
    public String getUserOfficeLocationId(String userId) {
        // TODO: Implement with UserShiftAssignment table
        return null;
    }

    /**
     * Map entity to response DTO
     */
    private ShiftResponse mapToResponse(Shift shift) {
        return ShiftResponse.builder()
            .id(shift.getId())
            .shiftId(shift.getShiftId())
            .name(shift.getName())
            .description(shift.getDescription())
            .code(shift.getCode())
            .startTime(shift.getStartTime())
            .endTime(shift.getEndTime())
            .workHoursMinutes(shift.getWorkHoursMinutes())
            .type(shift.getType())
            .graceMinutes(shift.getGraceMinutes())
            .flexibleStartMinutes(shift.getFlexibleStartMinutes())
            .flexibleEndMinutes(shift.getFlexibleEndMinutes())
            .mandatoryBreakMinutes(shift.getMandatoryBreakMinutes())
            .maxBreakMinutes(shift.getMaxBreakMinutes())
            .workingDays(shift.getWorkingDays())
            .weekendDays(shift.getWeekendDays())
            .allowOvertime(shift.getAllowOvertime())
            .maxOvertimeMinutesPerDay(shift.getMaxOvertimeMinutesPerDay())
            .minOvertimeMinutes(shift.getMinOvertimeMinutes())
            .isDefault(shift.getIsDefault())
            .isActive(shift.getIsActive())
            .createdAt(shift.getCreatedAt())
            .createdBy(shift.getCreatedBy())
            .lastModifiedAt(shift.getLastModifiedAt())
            .lastModifiedBy(shift.getLastModifiedBy())
            .build();
    }
}
