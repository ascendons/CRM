package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.TimeEntryType;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateTimeEntryRequest {

    private String taskId;
    private String projectId;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private TimeEntryType type;
    private boolean isBillable;
}
