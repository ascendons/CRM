package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.CalendarEventType;
import com.ultron.backend.domain.enums.CalendarEventStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "calendar_events")
public class CalendarEvent {

    @Id
    private String id;

    @Indexed(unique = true)
    private String eventId;

    @Indexed
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

    @Builder.Default
    private boolean isAllDay = false;

    @Builder.Default
    private String recurrence = "NONE";

    private String createdBy;
    private String updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Builder.Default
    private boolean isDeleted = false;
    private LocalDateTime deletedAt;
}
