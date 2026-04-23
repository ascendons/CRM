package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.TaskPriority;
import com.ultron.backend.domain.enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class CreateProjectTaskRequest {

    @NotBlank(message = "Task title is required")
    private String title;

    @NotBlank(message = "Project ID is required")
    private String projectId;

    private String description;
    private List<String> assigneeIds;
    private TaskPriority priority;
    private TaskStatus status;
    private String parentTaskId;
    private LocalDate dueDate;
    private Double estimatedHours;
    private Integer completionPct;
}
