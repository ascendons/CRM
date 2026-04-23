package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.TaskPriority;
import com.ultron.backend.domain.enums.TaskStatus;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class UpdateProjectTaskRequest {

    private String title;
    private String description;
    private List<String> assigneeIds;
    private TaskPriority priority;
    private TaskStatus status;
    private LocalDate dueDate;
    private Double estimatedHours;
    private Integer completionPct;
}
