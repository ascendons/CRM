package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.EngineerSchedule;
import com.ultron.backend.domain.enums.EngineerAvailability;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface EngineerScheduleRepository extends MongoRepository<EngineerSchedule, String> {

    Optional<EngineerSchedule> findByTenantIdAndEngineerIdAndDate(String tenantId, String engineerId, LocalDate date);

    List<EngineerSchedule> findByTenantIdAndDate(String tenantId, LocalDate date);

    List<EngineerSchedule> findByTenantIdAndEngineerIdAndDateBetween(String tenantId, String engineerId, LocalDate from, LocalDate to);

    List<EngineerSchedule> findByTenantIdAndAvailabilityAndDate(String tenantId, EngineerAvailability availability, LocalDate date);
}
