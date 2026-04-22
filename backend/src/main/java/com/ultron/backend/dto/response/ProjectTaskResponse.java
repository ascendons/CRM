package com.ultron.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.ultron.backend.domain.entity.ProjectTask;
import com.ultron.backend.domain.enums.TaskPriority;
import com.ultron.backend.domain.enums.TaskStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProjectTaskResponse {

    private String id;
    private String taskId;
    private String tenantId;
    private String projectId;
    private String title;
    private String description;
    private List<String> assigneeIds;
    private TaskPriority priority;
    private TaskStatus status;
    private String parentTaskId;
    private LocalDate dueDate;
    private Double estimatedHours;
    private Integer completionPct;
    private List<ProjectTask.ChecklistItem> checklistItems;
    private List<String> attachments;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
