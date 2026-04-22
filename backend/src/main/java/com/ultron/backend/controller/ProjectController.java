package com.ultron.backend.controller;

import com.ultron.backend.domain.enums.ProjectStatus;
import com.ultron.backend.dto.request.CreateProjectRequest;
import com.ultron.backend.dto.request.UpdateProjectRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.dto.response.ProjectResponse;
import com.ultron.backend.dto.response.ProjectTaskResponse;
import com.ultron.backend.service.ProjectService;
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
@RequestMapping("/projects")
@RequiredArgsConstructor
@Slf4j
public class ProjectController {

    private final ProjectService projectService;
    private final ProjectTaskService projectTaskService;

    @PostMapping
    @PreAuthorize("hasPermission('PROJECTS', 'CREATE')")
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(@Valid @RequestBody CreateProjectRequest request) {
        String userId = getCurrentUserId();
        ProjectResponse project = projectService.createProject(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Project created successfully", project));
    }

    @GetMapping
    @PreAuthorize("hasPermission('PROJECTS', 'VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getAllProjects(
            @RequestParam(required = false) ProjectStatus status) {
        List<ProjectResponse> projects = status != null
                ? projectService.getProjectsByStatus(status)
                : projectService.getAllProjects();
        return ResponseEntity.ok(ApiResponse.success("Projects retrieved successfully", projects));
    }

    @GetMapping("/{projectId}")
    @PreAuthorize("hasPermission('PROJECTS', 'VIEW')")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProjectById(@PathVariable String projectId) {
        ProjectResponse project = projectService.getProjectById(projectId);
        return ResponseEntity.ok(ApiResponse.success("Project retrieved successfully", project));
    }

    @PutMapping("/{projectId}")
    @PreAuthorize("hasPermission('PROJECTS', 'EDIT')")
    public ResponseEntity<ApiResponse<ProjectResponse>> updateProject(
            @PathVariable String projectId,
            @RequestBody UpdateProjectRequest request) {
        String userId = getCurrentUserId();
        ProjectResponse project = projectService.updateProject(projectId, request, userId);
        return ResponseEntity.ok(ApiResponse.success("Project updated successfully", project));
    }

    @DeleteMapping("/{projectId}")
    @PreAuthorize("hasPermission('PROJECTS', 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteProject(@PathVariable String projectId) {
        projectService.deleteProject(projectId);
        return ResponseEntity.ok(ApiResponse.success("Project deleted successfully", null));
    }

    @PostMapping("/{projectId}/members")
    @PreAuthorize("hasPermission('PROJECTS', 'MANAGE_MEMBERS')")
    public ResponseEntity<ApiResponse<ProjectResponse>> addMember(
            @PathVariable String projectId,
            @RequestBody Map<String, String> body) {
        String userId = getCurrentUserId();
        String memberId = body.get("memberId");
        ProjectResponse project = projectService.addMember(projectId, memberId, userId);
        return ResponseEntity.ok(ApiResponse.success("Member added successfully", project));
    }

    @DeleteMapping("/{projectId}/members/{memberId}")
    @PreAuthorize("hasPermission('PROJECTS', 'MANAGE_MEMBERS')")
    public ResponseEntity<ApiResponse<ProjectResponse>> removeMember(
            @PathVariable String projectId,
            @PathVariable String memberId) {
        String userId = getCurrentUserId();
        ProjectResponse project = projectService.removeMember(projectId, memberId, userId);
        return ResponseEntity.ok(ApiResponse.success("Member removed successfully", project));
    }

    @GetMapping("/{projectId}/tasks")
    @PreAuthorize("hasPermission('PROJECTS', 'VIEW')")
    public ResponseEntity<ApiResponse<List<ProjectTaskResponse>>> getProjectTasks(@PathVariable String projectId) {
        List<ProjectTaskResponse> tasks = projectTaskService.getTasksByProject(projectId);
        return ResponseEntity.ok(ApiResponse.success("Tasks retrieved successfully", tasks));
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }
}
