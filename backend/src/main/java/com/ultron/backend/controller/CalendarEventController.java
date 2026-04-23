package com.ultron.backend.controller;

import com.ultron.backend.dto.request.CreateCalendarEventRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.CalendarEventResponse;
import com.ultron.backend.service.CalendarEventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/calendar")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("isAuthenticated()")
public class CalendarEventController {

    private final CalendarEventService calendarEventService;

    @PostMapping
    public ResponseEntity<ApiResponse<CalendarEventResponse>> createEvent(
            @Valid @RequestBody CreateCalendarEventRequest request) {
        log.info("Creating calendar event: {}", request.getTitle());
        CalendarEventResponse response = calendarEventService.createEvent(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Event created successfully", response));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<CalendarEventResponse>>> getMyEvents(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        List<CalendarEventResponse> events = calendarEventService.getMyEvents(from, to);
        return ResponseEntity.ok(ApiResponse.success("Events retrieved successfully", events));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<CalendarEventResponse>>> getAllEvents(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        List<CalendarEventResponse> events = calendarEventService.getAllEvents(from, to);
        return ResponseEntity.ok(ApiResponse.success("All events retrieved successfully", events));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<CalendarEventResponse>>> getUserEvents(
            @PathVariable String userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        List<CalendarEventResponse> events = calendarEventService.getUserEvents(userId, from, to);
        return ResponseEntity.ok(ApiResponse.success("User events retrieved successfully", events));
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<ApiResponse<CalendarEventResponse>> getEventById(@PathVariable String eventId) {
        CalendarEventResponse response = calendarEventService.getEventById(eventId);
        return ResponseEntity.ok(ApiResponse.success("Event retrieved successfully", response));
    }

    @PutMapping("/{eventId}")
    public ResponseEntity<ApiResponse<CalendarEventResponse>> updateEvent(
            @PathVariable String eventId,
            @Valid @RequestBody CreateCalendarEventRequest request) {
        CalendarEventResponse response = calendarEventService.updateEvent(eventId, request);
        return ResponseEntity.ok(ApiResponse.success("Event updated successfully", response));
    }

    @DeleteMapping("/{eventId}")
    public ResponseEntity<ApiResponse<Void>> deleteEvent(@PathVariable String eventId) {
        calendarEventService.deleteEvent(eventId);
        return ResponseEntity.ok(ApiResponse.success("Event deleted successfully", null));
    }
}
