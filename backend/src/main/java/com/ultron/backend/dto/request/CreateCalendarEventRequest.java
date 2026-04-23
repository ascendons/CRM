package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.CalendarEventType;
import com.ultron.backend.domain.enums.CalendarEventStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class CreateCalendarEventRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Start time is required")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    private LocalDateTime endTime;

    private String location;
    private String clientId;
    private String clientName;

    private CalendarEventType eventType;
    private CalendarEventStatus status;

    private List<String> attendeeIds;
    private List<String> attendeeNames;

    private String color;
    private boolean isAllDay;
    private String recurrence;
}
