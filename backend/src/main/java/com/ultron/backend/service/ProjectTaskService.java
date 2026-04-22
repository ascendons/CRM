package com.ultron.backend.service;

import com.ultron.backend.domain.entity.ProjectTask;
import com.ultron.backend.domain.entity.TaskComment;
import com.ultron.backend.domain.enums.TaskStatus;
import com.ultron.backend.dto.request.CreateProjectTaskRequest;
import com.ultron.backend.dto.request.UpdateProjectTaskRequest;
import com.ultron.backend.dto.response.ProjectTaskResponse;
import com.ultron.backend.repository.ProjectTaskRepository;
import com.ultron.backend.repository.TaskCommentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectTaskService extends BaseTenantService {

    private final ProjectTaskRepository taskRepository;
    private final TaskCommentRepository commentRepository;
    private final TaskIdGeneratorService idGeneratorService;

    public ProjectTaskResponse createTask(CreateProjectTaskRequest request, String createdByUserId) {
        String tenantId = getCurrentTenantId();

        ProjectTask task = ProjectTask.builder()
                .taskId(idGeneratorService.generateTaskId())
                .tenantId(tenantId)
                .projectId(request.getProjectId())
                .title(request.getTitle())
                .description(request.getDescription())
                .assigneeIds(request.getAssigneeIds() != null ? request.getAssigneeIds() : new ArrayList<>())
                .priority(request.getPriority())
                .status(request.getStatus() != null ? request.getStatus() : TaskStatus.TODO)
                .parentTaskId(request.getParentTaskId())
                .dueDate(request.getDueDate())
                .estimatedHours(request.getEstimatedHours())
                .completionPct(request.getCompletionPct() != null ? request.getCompletionPct() : 0)
                .checklistItems(new ArrayList<>())
                .attachments(new ArrayList<>())
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(createdByUserId)
                .updatedAt(LocalDateTime.now())
                .updatedBy(createdByUserId)
                .build();

        task = taskRepository.save(task);
        return toResponse(task);
    }

    public List<ProjectTaskResponse> getTasksByProject(String projectId) {
        String tenantId = getCurrentTenantId();
        return taskRepository.findByTenantIdAndProjectIdAndIsDeletedFalse(tenantId, projectId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ProjectTaskResponse> getAllTasks() {
        String tenantId = getCurrentTenantId();
        return taskRepository.findByTenantIdAndIsDeletedFalse(tenantId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public ProjectTaskResponse getTaskById(String taskId) {
        String tenantId = getCurrentTenantId();
        ProjectTask task = taskRepository.findByTaskIdAndTenantId(taskId, tenantId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));
        return toResponse(task);
    }

    public ProjectTaskResponse updateTask(String taskId, UpdateProjectTaskRequest request, String updatedByUserId) {
        String tenantId = getCurrentTenantId();
        ProjectTask task = taskRepository.findByTaskIdAndTenantId(taskId, tenantId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));

        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getAssigneeIds() != null) task.setAssigneeIds(request.getAssigneeIds());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        if (request.getStatus() != null) task.setStatus(request.getStatus());
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());
        if (request.getEstimatedHours() != null) task.setEstimatedHours(request.getEstimatedHours());
        if (request.getCompletionPct() != null) task.setCompletionPct(request.getCompletionPct());

        task.setUpdatedAt(LocalDateTime.now());
        task.setUpdatedBy(updatedByUserId);

        task = taskRepository.save(task);
        return toResponse(task);
    }

    public ProjectTaskResponse updateTaskStatus(String taskId, TaskStatus status, String updatedByUserId) {
        String tenantId = getCurrentTenantId();
        ProjectTask task = taskRepository.findByTaskIdAndTenantId(taskId, tenantId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));

        // Validate dependencies before marking DONE
        if (status == TaskStatus.DONE && task.getDependsOnTaskIds() != null && !task.getDependsOnTaskIds().isEmpty()) {
            for (String depId : task.getDependsOnTaskIds()) {
                taskRepository.findByTaskIdAndTenantId(depId, tenantId).ifPresent(dep -> {
                    if (dep.getStatus() != TaskStatus.DONE) {
                        throw new RuntimeException("Cannot complete task: dependency " + depId + " is not done yet");
                    }
                });
            }
        }

        task.setStatus(status);
        if (status == TaskStatus.DONE) {
            task.setCompletionPct(100);
        }
        task.setUpdatedAt(LocalDateTime.now());
        task.setUpdatedBy(updatedByUserId);
        return toResponse(taskRepository.save(task));
    }

    public void deleteTask(String taskId) {
        String tenantId = getCurrentTenantId();
        ProjectTask task = taskRepository.findByTaskIdAndTenantId(taskId, tenantId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));
        task.setDeleted(true);
        task.setUpdatedAt(LocalDateTime.now());
        taskRepository.save(task);
    }

    public TaskComment addComment(String taskId, String authorId, String body, List<String> mentions) {
        String tenantId = getCurrentTenantId();
        TaskComment comment = TaskComment.builder()
                .commentId("CMT-" + System.currentTimeMillis())
                .tenantId(tenantId)
                .taskId(taskId)
                .authorId(authorId)
                .body(body)
                .mentions(mentions != null ? mentions : new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .build();
        return commentRepository.save(comment);
    }

    public List<TaskComment> getComments(String taskId) {
        String tenantId = getCurrentTenantId();
        return commentRepository.findByTenantIdAndTaskIdOrderByCreatedAtAsc(tenantId, taskId);
    }

    private ProjectTaskResponse toResponse(ProjectTask task) {
        return ProjectTaskResponse.builder()
                .id(task.getId())
                .taskId(task.getTaskId())
                .tenantId(task.getTenantId())
                .projectId(task.getProjectId())
                .title(task.getTitle())
                .description(task.getDescription())
                .assigneeIds(task.getAssigneeIds())
                .priority(task.getPriority())
                .status(task.getStatus())
                .parentTaskId(task.getParentTaskId())
                .dueDate(task.getDueDate())
                .estimatedHours(task.getEstimatedHours())
                .completionPct(task.getCompletionPct())
                .checklistItems(task.getChecklistItems())
                .attachments(task.getAttachments())
                .createdAt(task.getCreatedAt())
                .createdBy(task.getCreatedBy())
                .updatedAt(task.getUpdatedAt())
                .updatedBy(task.getUpdatedBy())
                .build();
    }
}
