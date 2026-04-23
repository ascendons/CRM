package com.ultron.backend.service;

import com.ultron.backend.domain.entity.CalendarEvent;
import com.ultron.backend.domain.enums.CalendarEventStatus;
import com.ultron.backend.domain.enums.CalendarEventType;
import com.ultron.backend.dto.request.CreateCalendarEventRequest;
import com.ultron.backend.dto.response.CalendarEventResponse;
import com.ultron.backend.repository.CalendarEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CalendarEventService extends BaseTenantService {

    private final CalendarEventRepository calendarEventRepository;

    public CalendarEventResponse createEvent(CreateCalendarEventRequest req) {
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();

        String eventId = "EVT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        CalendarEvent event = CalendarEvent.builder()
                .eventId(eventId)
                .tenantId(tenantId)
                .title(req.getTitle())
                .description(req.getDescription())
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .location(req.getLocation())
                .clientId(req.getClientId())
                .clientName(req.getClientName())
                .eventType(req.getEventType() != null ? req.getEventType() : CalendarEventType.OTHER)
                .status(req.getStatus() != null ? req.getStatus() : CalendarEventStatus.SCHEDULED)
                .attendeeIds(req.getAttendeeIds() != null ? req.getAttendeeIds() : new ArrayList<>())
                .attendeeNames(req.getAttendeeNames() != null ? req.getAttendeeNames() : new ArrayList<>())
                .color(req.getColor())
                .isAllDay(req.isAllDay())
                .recurrence(req.getRecurrence() != null ? req.getRecurrence() : "NONE")
                .createdBy(userId)
                .updatedBy(userId)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .isDeleted(false)
                .build();

        CalendarEvent saved = calendarEventRepository.save(event);
        logTenantOperation("CREATE", "CalendarEvent", saved.getEventId());
        return toResponse(saved);
    }

    public CalendarEventResponse updateEvent(String eventId, CreateCalendarEventRequest req) {
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();

        CalendarEvent event = calendarEventRepository.findByEventIdAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new RuntimeException("Calendar event not found: " + eventId));

        validateResourceTenantOwnership(event.getTenantId());

        if (!event.getCreatedBy().equals(userId) && !isCurrentUserTenantAdmin()) {
            throw new SecurityException("You do not have permission to update this event");
        }

        event.setTitle(req.getTitle());
        event.setDescription(req.getDescription());
        event.setStartTime(req.getStartTime());
        event.setEndTime(req.getEndTime());
        event.setLocation(req.getLocation());
        event.setClientId(req.getClientId());
        event.setClientName(req.getClientName());
        if (req.getEventType() != null) event.setEventType(req.getEventType());
        if (req.getStatus() != null) event.setStatus(req.getStatus());
        if (req.getAttendeeIds() != null) event.setAttendeeIds(req.getAttendeeIds());
        if (req.getAttendeeNames() != null) event.setAttendeeNames(req.getAttendeeNames());
        event.setColor(req.getColor());
        event.setAllDay(req.isAllDay());
        if (req.getRecurrence() != null) event.setRecurrence(req.getRecurrence());
        event.setUpdatedBy(userId);
        event.setUpdatedAt(LocalDateTime.now());

        CalendarEvent saved = calendarEventRepository.save(event);
        logTenantOperation("UPDATE", "CalendarEvent", eventId);
        return toResponse(saved);
    }

    public void deleteEvent(String eventId) {
        String userId = getCurrentUserId();

        CalendarEvent event = calendarEventRepository.findByEventIdAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new RuntimeException("Calendar event not found: " + eventId));

        validateResourceTenantOwnership(event.getTenantId());

        if (!event.getCreatedBy().equals(userId) && !isCurrentUserTenantAdmin()) {
            throw new SecurityException("You do not have permission to delete this event");
        }

        event.setDeleted(true);
        event.setDeletedAt(LocalDateTime.now());
        event.setUpdatedBy(userId);
        event.setUpdatedAt(LocalDateTime.now());
        calendarEventRepository.save(event);
        logTenantOperation("DELETE", "CalendarEvent", eventId);
    }

    public List<CalendarEventResponse> getMyEvents(LocalDateTime from, LocalDateTime to) {
        String tenantId = getCurrentTenantId();
        String userId = getCurrentUserId();

        List<CalendarEvent> createdByMe = calendarEventRepository
                .findByTenantIdAndCreatedByAndStartTimeBetweenAndIsDeletedFalse(tenantId, userId, from, to);

        List<CalendarEvent> attendingAs = calendarEventRepository
                .findByTenantIdAndAttendeeIdsContainingAndStartTimeBetweenAndIsDeletedFalse(tenantId, userId, from, to);

        // Merge deduplicating by id
        List<CalendarEvent> merged = new ArrayList<>(createdByMe);
        for (CalendarEvent e : attendingAs) {
            if (merged.stream().noneMatch(m -> m.getId().equals(e.getId()))) {
                merged.add(e);
            }
        }

        return merged.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<CalendarEventResponse> getAllEvents(LocalDateTime from, LocalDateTime to) {
        String tenantId = getCurrentTenantId();
        return calendarEventRepository
                .findByTenantIdAndStartTimeBetweenAndIsDeletedFalse(tenantId, from, to)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public CalendarEventResponse getEventById(String eventId) {
        CalendarEvent event = calendarEventRepository.findByEventIdAndIsDeletedFalse(eventId)
                .orElseThrow(() -> new RuntimeException("Calendar event not found: " + eventId));
        validateResourceTenantOwnership(event.getTenantId());
        return toResponse(event);
    }

    public List<CalendarEventResponse> getUserEvents(String userId, LocalDateTime from, LocalDateTime to) {
        String tenantId = getCurrentTenantId();
        List<CalendarEvent> createdByUser = calendarEventRepository
                .findByTenantIdAndCreatedByAndStartTimeBetweenAndIsDeletedFalse(tenantId, userId, from, to);
        List<CalendarEvent> attendingAs = calendarEventRepository
                .findByTenantIdAndAttendeeIdsContainingAndStartTimeBetweenAndIsDeletedFalse(tenantId, userId, from, to);

        List<CalendarEvent> merged = new ArrayList<>(createdByUser);
        for (CalendarEvent e : attendingAs) {
            if (merged.stream().noneMatch(m -> m.getId().equals(e.getId()))) {
                merged.add(e);
            }
        }
        return merged.stream().map(this::toResponse).collect(Collectors.toList());
    }

    private CalendarEventResponse toResponse(CalendarEvent e) {
        return CalendarEventResponse.builder()
                .id(e.getId())
                .eventId(e.getEventId())
                .tenantId(e.getTenantId())
                .title(e.getTitle())
                .description(e.getDescription())
                .startTime(e.getStartTime())
                .endTime(e.getEndTime())
                .location(e.getLocation())
                .clientId(e.getClientId())
                .clientName(e.getClientName())
                .eventType(e.getEventType())
                .status(e.getStatus())
                .attendeeIds(e.getAttendeeIds())
                .attendeeNames(e.getAttendeeNames())
                .color(e.getColor())
                .isAllDay(e.isAllDay())
                .recurrence(e.getRecurrence())
                .createdBy(e.getCreatedBy())
                .updatedBy(e.getUpdatedBy())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .isDeleted(e.isDeleted())
                .deletedAt(e.getDeletedAt())
                .build();
    }
}
