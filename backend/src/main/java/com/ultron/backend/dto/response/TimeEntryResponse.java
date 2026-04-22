package com.ultron.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.ultron.backend.domain.enums.TimeEntryType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TimeEntryResponse {

    private String id;
    private String entryId;
    private String tenantId;
    private String userId;
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
