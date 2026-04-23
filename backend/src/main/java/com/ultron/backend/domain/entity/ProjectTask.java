package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.RecurrenceFrequency;
import com.ultron.backend.domain.enums.TaskPriority;
import com.ultron.backend.domain.enums.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "project_tasks")
public class ProjectTask {

    @Id
    private String id;

    @Indexed(unique = true)
    private String taskId;

    @Indexed
    private String tenantId;

    @Indexed
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
    private List<ChecklistItem> checklistItems;
    private List<String> attachments;
    private RecurrenceRule recurrenceRule;
    private List<String> dependsOnTaskIds;
    private Integer blockedByCount;

    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecurrenceRule {
        private RecurrenceFrequency frequency;
        private Integer interval;
        private LocalDate endDate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChecklistItem {
        private String itemId;
        private String label;
        private boolean completed;
    }
}
