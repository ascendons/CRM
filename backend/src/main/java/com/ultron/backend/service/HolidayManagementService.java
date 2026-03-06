package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Holiday;
import com.ultron.backend.dto.holiday.CreateHolidayRequest;
import com.ultron.backend.dto.holiday.HolidayResponse;
import com.ultron.backend.exception.BusinessException;
import com.ultron.backend.repository.HolidayRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for holiday management (CRUD operations)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class HolidayManagementService extends BaseTenantService {

    private final HolidayRepository holidayRepository;

    /**
     * Create holiday
     */
    @Transactional
    @CacheEvict(value = "holidays", allEntries = true)
    public HolidayResponse createHoliday(CreateHolidayRequest request, String userId) {
        String tenantId = getTenantId();
        log.info("Creating holiday for date: {} in tenant: {}", request.getDate(), tenantId);

        // Check if holiday already exists for this date
        if (holidayRepository.existsByTenantIdAndDateAndIsDeletedFalse(tenantId, request.getDate())) {
            throw new BusinessException("Holiday already exists for this date");
        }

        Holiday holiday = Holiday.builder()
                .tenantId(tenantId)
                .date(request.getDate())
                .year(request.getDate().getYear())
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType())
                .applicableLocations(request.getApplicableLocations() != null
                        ? request.getApplicableLocations() : new ArrayList<>())
                .applicableStates(request.getApplicableStates() != null
                        ? request.getApplicableStates() : new ArrayList<>())
                .isOptional(request.getIsOptional() != null && request.getIsOptional())
                .maxOptionalAllowed(request.getMaxOptionalAllowed())
                .createdAt(LocalDateTime.now())
                .createdBy(userId)
                .isDeleted(false)
                .build();

        holidayRepository.save(holiday);

        log.info("Holiday created: {} for date: {}", holiday.getName(), holiday.getDate());
        return mapToResponse(holiday);
    }

    /**
     * Update holiday
     */
    @Transactional
    @CacheEvict(value = "holidays", allEntries = true)
    public HolidayResponse updateHoliday(String holidayId, CreateHolidayRequest request, String userId) {
        String tenantId = getTenantId();
        log.info("Updating holiday: {}", holidayId);

        Holiday holiday = holidayRepository.findById(holidayId)
                .orElseThrow(() -> new BusinessException("Holiday not found"));

        if (!holiday.getTenantId().equals(tenantId)) {
            throw new BusinessException("Holiday not found");
        }

        // Check if changing date to one that already has a holiday
        if (!holiday.getDate().equals(request.getDate())) {
            if (holidayRepository.existsByTenantIdAndDateAndIsDeletedFalse(tenantId, request.getDate())) {
                throw new BusinessException("Holiday already exists for the new date");
            }
        }

        holiday.setDate(request.getDate());
        holiday.setYear(request.getDate().getYear());
        holiday.setName(request.getName());
        holiday.setDescription(request.getDescription());
        holiday.setType(request.getType());
        holiday.setApplicableLocations(request.getApplicableLocations());
        holiday.setApplicableStates(request.getApplicableStates());
        holiday.setIsOptional(request.getIsOptional() != null && request.getIsOptional());
        holiday.setMaxOptionalAllowed(request.getMaxOptionalAllowed());
        holiday.setLastModifiedAt(LocalDateTime.now());
        holiday.setLastModifiedBy(userId);

        holidayRepository.save(holiday);

        log.info("Holiday updated: {}", holiday.getName());
        return mapToResponse(holiday);
    }

    /**
     * Delete holiday
     */
    @Transactional
    @CacheEvict(value = "holidays", allEntries = true)
    public void deleteHoliday(String holidayId, String userId) {
        String tenantId = getTenantId();
        log.info("Deleting holiday: {}", holidayId);

        Holiday holiday = holidayRepository.findById(holidayId)
                .orElseThrow(() -> new BusinessException("Holiday not found"));

        if (!holiday.getTenantId().equals(tenantId)) {
            throw new BusinessException("Holiday not found");
        }

        holiday.setIsDeleted(true);
        holiday.setDeletedAt(LocalDateTime.now());
        holiday.setDeletedBy(userId);

        holidayRepository.save(holiday);

        log.info("Holiday deleted: {}", holiday.getName());
    }

    /**
     * Get holiday by ID
     */
    public HolidayResponse getHolidayById(String holidayId) {
        String tenantId = getTenantId();

        Holiday holiday = holidayRepository.findById(holidayId)
                .orElseThrow(() -> new BusinessException("Holiday not found"));

        if (!holiday.getTenantId().equals(tenantId) || holiday.getIsDeleted()) {
            throw new BusinessException("Holiday not found");
        }

        return mapToResponse(holiday);
    }

    /**
     * Get holidays by year
     */
    @Cacheable(value = "holidays", key = "T(com.ultron.backend.multitenancy.TenantContext).getTenantId() + '_year_' + #year")
    public List<HolidayResponse> getHolidaysByYear(Integer year) {
        String tenantId = getTenantId();
        List<Holiday> holidays = holidayRepository
                .findByTenantIdAndYearAndIsDeletedFalseOrderByDateAsc(tenantId, year);
        return holidays.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Get all holidays
     */
    public List<HolidayResponse> getAllHolidays() {
        String tenantId = getTenantId();
        // Get holidays for current year and next year
        int currentYear = java.time.LocalDate.now().getYear();
        List<Holiday> holidays = new ArrayList<>();
        holidays.addAll(holidayRepository.findByTenantIdAndYearAndIsDeletedFalseOrderByDateAsc(tenantId, currentYear));
        holidays.addAll(holidayRepository.findByTenantIdAndYearAndIsDeletedFalseOrderByDateAsc(tenantId, currentYear + 1));
        return holidays.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private HolidayResponse mapToResponse(Holiday holiday) {
        return HolidayResponse.builder()
                .id(holiday.getId())
                .tenantId(holiday.getTenantId())
                .date(holiday.getDate())
                .year(holiday.getYear())
                .name(holiday.getName())
                .description(holiday.getDescription())
                .type(holiday.getType())
                .applicableLocations(holiday.getApplicableLocations())
                .applicableStates(holiday.getApplicableStates())
                .isOptional(holiday.getIsOptional())
                .maxOptionalAllowed(holiday.getMaxOptionalAllowed())
                .createdAt(holiday.getCreatedAt())
                .createdBy(holiday.getCreatedBy())
                .lastModifiedAt(holiday.getLastModifiedAt())
                .lastModifiedBy(holiday.getLastModifiedBy())
                .build();
    }
}
