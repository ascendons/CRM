package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.Holiday;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository for Holiday entity with tenant-aware queries
 */
@Repository
public interface HolidayRepository extends MongoRepository<Holiday, String> {

    // Find by date
    Optional<Holiday> findByTenantIdAndDateAndIsDeletedFalse(
            String tenantId, LocalDate date);

    // Find by year
    List<Holiday> findByTenantIdAndYearAndIsDeletedFalseOrderByDateAsc(
            String tenantId, Integer year);

    // Find by date range
    List<Holiday> findByTenantIdAndDateBetweenAndIsDeletedFalseOrderByDateAsc(
            String tenantId, LocalDate startDate, LocalDate endDate);

    // Check if holiday exists
    boolean existsByTenantIdAndDateAndIsDeletedFalse(
            String tenantId, LocalDate date);
}
