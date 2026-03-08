package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Holiday;
import com.ultron.backend.repository.HolidayRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * Service for holiday management
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class HolidayService extends BaseTenantService {

    private final HolidayRepository holidayRepository;

    /**
     * Check if a date is a holiday
     */
    @Cacheable(value = "holidays", key = "T(com.ultron.backend.multitenancy.TenantContext).getTenantId() + '_' + #date")
    public boolean isHoliday(LocalDate date) {
        String tenantId = getTenantId();
        return holidayRepository.existsByTenantIdAndDateAndIsDeletedFalse(tenantId, date);
    }

    /**
     * Get holidays for a year
     */
    @Cacheable(value = "holidays", key = "T(com.ultron.backend.multitenancy.TenantContext).getTenantId() + '_year_' + #year")
    public List<Holiday> getHolidaysByYear(Integer year) {
        String tenantId = getTenantId();
        return holidayRepository.findByTenantIdAndYearAndIsDeletedFalseOrderByDateAsc(tenantId, year);
    }

    /**
     * Get holidays in date range
     */
    public List<Holiday> getHolidaysByDateRange(LocalDate startDate, LocalDate endDate) {
        String tenantId = getTenantId();
        return holidayRepository.findByTenantIdAndDateBetweenAndIsDeletedFalseOrderByDateAsc(
                tenantId, startDate, endDate);
    }
}
