package com.ultron.backend.scheduler;

import com.ultron.backend.domain.entity.ProjectTask;
import com.ultron.backend.domain.enums.RecurrenceFrequency;
import com.ultron.backend.domain.enums.TaskStatus;
import com.ultron.backend.multitenancy.TenantContext;
import com.ultron.backend.repository.ProjectTaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component @RequiredArgsConstructor @Slf4j
public class RecurringTaskScheduler {
    private final MongoTemplate mongoTemplate;
    private final ProjectTaskRepository taskRepository;

    @Scheduled(cron = "0 0 0 * * *")
    public void processRecurringTasks() {
        log.info("Processing recurring tasks...");
        // Find completed tasks with recurrence rules (query all tenants by not filtering tenantId)
        Query query = new Query(Criteria.where("status").is(TaskStatus.DONE)
                .and("recurrenceRule").exists(true)
                .and("isDeleted").is(false));
        List<ProjectTask> tasks = mongoTemplate.find(query, ProjectTask.class);

        for (ProjectTask task : tasks) {
            try {
                if (task.getRecurrenceRule() == null) continue;
                LocalDate nextDue = computeNextDate(task);
                if (nextDue == null) continue;
                if (task.getRecurrenceRule().getEndDate() != null && nextDue.isAfter(task.getRecurrenceRule().getEndDate())) continue;

                ProjectTask next = ProjectTask.builder()
                        .taskId("TASK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                        .tenantId(task.getTenantId()).projectId(task.getProjectId())
                        .title(task.getTitle()).description(task.getDescription())
                        .assigneeIds(task.getAssigneeIds() != null ? new ArrayList<>(task.getAssigneeIds()) : null)
                        .priority(task.getPriority()).status(TaskStatus.TODO)
                        .parentTaskId(task.getParentTaskId()).dueDate(nextDue)
                        .estimatedHours(task.getEstimatedHours()).completionPct(0)
                        .checklistItems(new ArrayList<>()).attachments(new ArrayList<>())
                        .recurrenceRule(task.getRecurrenceRule())
                        .isDeleted(false).createdAt(LocalDateTime.now()).createdBy("system")
                        .updatedAt(LocalDateTime.now()).updatedBy("system").build();
                taskRepository.save(next);
                log.info("Created next occurrence for task {}", task.getTaskId());
            } catch (Exception e) {
                log.error("Failed to process recurring task {}: {}", task.getTaskId(), e.getMessage());
            }
        }
    }

    private LocalDate computeNextDate(ProjectTask task) {
        LocalDate base = task.getDueDate() != null ? task.getDueDate() : LocalDate.now();
        int interval = task.getRecurrenceRule().getInterval() != null ? task.getRecurrenceRule().getInterval() : 1;
        RecurrenceFrequency freq = task.getRecurrenceRule().getFrequency();
        if (freq == null) return null;
        return switch (freq) {
            case DAILY -> base.plusDays(interval);
            case WEEKLY -> base.plusWeeks(interval);
            case MONTHLY -> base.plusMonths(interval);
        };
    }
}
