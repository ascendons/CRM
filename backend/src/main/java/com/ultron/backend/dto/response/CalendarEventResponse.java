package com.ultron.backend.dto.response;

import com.ultron.backend.domain.enums.CalendarEventType;
import com.ultron.backend.domain.enums.CalendarEventStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEventResponse {

    private String id;
    private String eventId;
    private String tenantId;
    private String title;
    private String description;
    private LocalDateTime startTime;
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
    private String createdBy;
    private String updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isDeleted;
    private LocalDateTime deletedAt;
}
