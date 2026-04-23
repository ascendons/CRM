package com.ultron.backend.repository;

import com.ultron.backend.domain.entity.CalendarEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CalendarEventRepository extends MongoRepository<CalendarEvent, String> {

    List<CalendarEvent> findByTenantIdAndIsDeletedFalse(String tenantId, Pageable pageable);

    List<CalendarEvent> findByTenantIdAndCreatedByAndIsDeletedFalse(String tenantId, String userId);

    List<CalendarEvent> findByTenantIdAndStartTimeBetweenAndIsDeletedFalse(
            String tenantId, LocalDateTime from, LocalDateTime to);

    List<CalendarEvent> findByTenantIdAndCreatedByAndStartTimeBetweenAndIsDeletedFalse(
            String tenantId, String userId, LocalDateTime from, LocalDateTime to);

    List<CalendarEvent> findByTenantIdAndAttendeeIdsContainingAndIsDeletedFalse(
            String tenantId, String userId);

    List<CalendarEvent> findByTenantIdAndAttendeeIdsContainingAndStartTimeBetweenAndIsDeletedFalse(
            String tenantId, String userId, LocalDateTime from, LocalDateTime to);

    Optional<CalendarEvent> findByEventIdAndIsDeletedFalse(String eventId);
}
