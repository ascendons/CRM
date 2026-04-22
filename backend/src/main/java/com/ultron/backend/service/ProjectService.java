package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Project;
import com.ultron.backend.domain.enums.ProjectStatus;
import com.ultron.backend.dto.request.CreateProjectRequest;
import com.ultron.backend.dto.request.UpdateProjectRequest;
import com.ultron.backend.dto.response.ProjectResponse;
import com.ultron.backend.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService extends BaseTenantService {

    private final ProjectRepository projectRepository;
    private final ProjectIdGeneratorService idGeneratorService;

    public ProjectResponse createProject(CreateProjectRequest request, String createdByUserId) {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Creating project: {}", tenantId, request.getName());

        Project project = Project.builder()
                .projectId(idGeneratorService.generateProjectId())
                .tenantId(tenantId)
                .name(request.getName())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : ProjectStatus.PLANNING)
                .ownerId(request.getOwnerId() != null ? request.getOwnerId() : createdByUserId)
                .memberIds(request.getMemberIds() != null ? request.getMemberIds() : new ArrayList<>())
                .startDate(request.getStartDate())
                .dueDate(request.getDueDate())
                .budget(request.getBudget())
                .milestones(request.getMilestones())
                .tags(request.getTags())
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(createdByUserId)
                .updatedAt(LocalDateTime.now())
                .updatedBy(createdByUserId)
                .build();

        project = projectRepository.save(project);
        return toResponse(project);
    }

    public List<ProjectResponse> getAllProjects() {
        String tenantId = getCurrentTenantId();
        return projectRepository.findByTenantIdAndIsDeletedFalse(tenantId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ProjectResponse> getProjectsByStatus(ProjectStatus status) {
        String tenantId = getCurrentTenantId();
        return projectRepository.findByTenantIdAndStatusAndIsDeletedFalse(tenantId, status)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public ProjectResponse getProjectById(String projectId) {
        String tenantId = getCurrentTenantId();
        Project project = projectRepository.findByProjectIdAndTenantId(projectId, tenantId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));
        return toResponse(project);
    }

    public ProjectResponse updateProject(String projectId, UpdateProjectRequest request, String updatedByUserId) {
        String tenantId = getCurrentTenantId();
        Project project = projectRepository.findByProjectIdAndTenantId(projectId, tenantId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        if (request.getName() != null) project.setName(request.getName());
        if (request.getDescription() != null) project.setDescription(request.getDescription());
        if (request.getStatus() != null) project.setStatus(request.getStatus());
        if (request.getOwnerId() != null) project.setOwnerId(request.getOwnerId());
        if (request.getMemberIds() != null) project.setMemberIds(request.getMemberIds());
        if (request.getStartDate() != null) project.setStartDate(request.getStartDate());
        if (request.getDueDate() != null) project.setDueDate(request.getDueDate());
        if (request.getBudget() != null) project.setBudget(request.getBudget());
        if (request.getMilestones() != null) project.setMilestones(request.getMilestones());
        if (request.getTags() != null) project.setTags(request.getTags());

        project.setUpdatedAt(LocalDateTime.now());
        project.setUpdatedBy(updatedByUserId);

        project = projectRepository.save(project);
        return toResponse(project);
    }

    public void deleteProject(String projectId) {
        String tenantId = getCurrentTenantId();
        Project project = projectRepository.findByProjectIdAndTenantId(projectId, tenantId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));
        project.setDeleted(true);
        project.setUpdatedAt(LocalDateTime.now());
        projectRepository.save(project);
    }

    public ProjectResponse addMember(String projectId, String memberId, String updatedByUserId) {
        String tenantId = getCurrentTenantId();
        Project project = projectRepository.findByProjectIdAndTenantId(projectId, tenantId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        if (project.getMemberIds() == null) {
            project.setMemberIds(new ArrayList<>());
        }
        if (!project.getMemberIds().contains(memberId)) {
            project.getMemberIds().add(memberId);
        }
        project.setUpdatedAt(LocalDateTime.now());
        project.setUpdatedBy(updatedByUserId);
        return toResponse(projectRepository.save(project));
    }

    public ProjectResponse removeMember(String projectId, String memberId, String updatedByUserId) {
        String tenantId = getCurrentTenantId();
        Project project = projectRepository.findByProjectIdAndTenantId(projectId, tenantId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        if (project.getMemberIds() != null) {
            project.getMemberIds().remove(memberId);
        }
        project.setUpdatedAt(LocalDateTime.now());
        project.setUpdatedBy(updatedByUserId);
        return toResponse(projectRepository.save(project));
    }

    private ProjectResponse toResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .projectId(project.getProjectId())
                .tenantId(project.getTenantId())
                .name(project.getName())
                .description(project.getDescription())
                .status(project.getStatus())
                .ownerId(project.getOwnerId())
                .memberIds(project.getMemberIds())
                .startDate(project.getStartDate())
                .dueDate(project.getDueDate())
                .budget(project.getBudget())
                .milestones(project.getMilestones())
                .tags(project.getTags())
                .createdAt(project.getCreatedAt())
                .createdBy(project.getCreatedBy())
                .updatedAt(project.getUpdatedAt())
                .updatedBy(project.getUpdatedBy())
                .build();
    }
}
