package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.TaskComment;
import com.ultron.backend.domain.enums.TaskStatus;
import com.ultron.backend.dto.request.CreateProjectTaskRequest;
import com.ultron.backend.dto.request.UpdateProjectTaskRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.ProjectTaskResponse;
import com.ultron.backend.service.ProjectTaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/project-tasks")
@RequiredArgsConstructor
@Slf4j
public class ProjectTaskController {

    private final ProjectTaskService projectTaskService;

    @PostMapping
    @PreAuthorize("hasPermission('PROJECTS', 'CREATE')")
    public ResponseEntity<ApiResponse<ProjectTaskResponse>> createTask(@Valid @RequestBody CreateProjectTaskRequest request) {
        String userId = getCurrentUserId();
        ProjectTaskResponse task = projectTaskService.createTask(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Task created successfully", task));
    }

    @GetMapping
    @PreAuthorize("hasPermission('PROJECTS', 'VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectTaskResponse>>> getAllTasks() {
        return ResponseEntity.ok(ApiResponse.success("Tasks retrieved", projectTaskService.getAllTasks()));
    }

    @GetMapping("/{taskId}")
    @PreAuthorize("hasPermission('PROJECTS', 'VIEW')")
    public ResponseEntity<ApiResponse<ProjectTaskResponse>> getTaskById(@PathVariable String taskId) {
        return ResponseEntity.ok(ApiResponse.success("Task retrieved", projectTaskService.getTaskById(taskId)));
    }

    @PutMapping("/{taskId}")
    @PreAuthorize("hasPermission('PROJECTS', 'EDIT')")
    public ResponseEntity<ApiResponse<ProjectTaskResponse>> updateTask(
            @PathVariable String taskId,
            @RequestBody UpdateProjectTaskRequest request) {
        String userId = getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Task updated", projectTaskService.updateTask(taskId, request, userId)));
    }

    @DeleteMapping("/{taskId}")
    @PreAuthorize("hasPermission('PROJECTS', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable String taskId) {
        projectTaskService.deleteTask(taskId);
        return ResponseEntity.ok(ApiResponse.success("Task deleted", null));
    }

    @PostMapping("/{taskId}/status")
    @PreAuthorize("hasPermission('PROJECTS', 'EDIT')")
    public ResponseEntity<ApiResponse<ProjectTaskResponse>> updateStatus(
            @PathVariable String taskId,
            @RequestBody Map<String, String> body) {
        String userId = getCurrentUserId();
        TaskStatus status = TaskStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(ApiResponse.success("Status updated", projectTaskService.updateTaskStatus(taskId, status, userId)));
    }

    @PostMapping("/{taskId}/comments")
    @PreAuthorize("hasPermission('PROJECTS', 'EDIT')")
    public ResponseEntity<ApiResponse<TaskComment>> addComment(
            @PathVariable String taskId,
            @RequestBody Map<String, Object> body) {
        String userId = getCurrentUserId();
        String commentBody = (String) body.get("body");
        @SuppressWarnings("unchecked")
        List<String> mentions = (List<String>) body.getOrDefault("mentions", List.of());
        TaskComment comment = projectTaskService.addComment(taskId, userId, commentBody, mentions);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Comment added", comment));
    }

    @GetMapping("/{taskId}/comments")
    @PreAuthorize("hasPermission('PROJECTS', 'VIEW')")
    public ResponseEntity<ApiResponse<List<TaskComment>>> getComments(@PathVariable String taskId) {
        return ResponseEntity.ok(ApiResponse.success("Comments retrieved", projectTaskService.getComments(taskId)));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }
}
