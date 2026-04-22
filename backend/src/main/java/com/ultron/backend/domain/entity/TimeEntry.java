package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.TimeEntryType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "time_entries")
public class TimeEntry {

    @Id
    private String id;

    @Indexed(unique = true)
    private String entryId;

    @Indexed
    private String tenantId;

    @Indexed
    private String userId;

    @Indexed
    private String taskId;

    private String projectId;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private TimeEntryType type;
    private boolean isBillable;
    private LocalDateTime createdAt;
}
