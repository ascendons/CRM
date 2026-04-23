package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.TimeEntry;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TimeEntryRepository extends MongoRepository<TimeEntry, String> {

    List<TimeEntry> findByTenantIdAndUserId(String tenantId, String userId);

    List<TimeEntry> findByTenantIdAndTaskId(String tenantId, String taskId);

    List<TimeEntry> findByTenantIdAndStartTimeBetween(String tenantId, LocalDateTime from, LocalDateTime to);

    List<TimeEntry> findByTenantIdAndUserIdAndStartTimeBetween(String tenantId, String userId, LocalDateTime from, LocalDateTime to);

    Optional<TimeEntry> findByTenantIdAndUserIdAndEndTimeIsNull(String tenantId, String userId);

    Optional<TimeEntry> findByEntryIdAndTenantId(String entryId, String tenantId);
}
