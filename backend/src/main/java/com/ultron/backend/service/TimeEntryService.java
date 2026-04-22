package com.ultron.backend.service;

import com.ultron.backend.domain.entity.ProjectTask;
import com.ultron.backend.domain.entity.TimeEntry;
import com.ultron.backend.domain.enums.TaskStatus;
import com.ultron.backend.domain.enums.TimeEntryType;
import com.ultron.backend.dto.request.CreateTimeEntryRequest;
import com.ultron.backend.dto.response.TimeEntryResponse;
import com.ultron.backend.dto.response.WorkloadSummary;
import com.ultron.backend.repository.ProjectTaskRepository;
import com.ultron.backend.repository.TimeEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TimeEntryService extends BaseTenantService {

    private final TimeEntryRepository timeEntryRepository;
    private final ProjectTaskRepository taskRepository;

    public TimeEntryResponse createEntry(CreateTimeEntryRequest request, String userId) {
        String tenantId = getCurrentTenantId();

        LocalDateTime startTime = request.getStartTime() != null ? request.getStartTime() : LocalDateTime.now();
        Integer duration = request.getDurationMinutes();

        if (duration == null && request.getStartTime() != null && request.getEndTime() != null) {
            long minutes = java.time.Duration.between(request.getStartTime(), request.getEndTime()).toMinutes();
            duration = (int) minutes;
        }

        TimeEntry entry = TimeEntry.builder()
                .entryId("TE-" + System.currentTimeMillis())
                .tenantId(tenantId)
                .userId(userId)
                .taskId(request.getTaskId())
                .projectId(request.getProjectId())
                .description(request.getDescription())
                .startTime(startTime)
                .endTime(request.getEndTime())
                .durationMinutes(duration)
                .type(request.getType() != null ? request.getType() : TimeEntryType.NON_BILLABLE)
                .isBillable(request.isBillable())
                .createdAt(LocalDateTime.now())
                .build();

        entry = timeEntryRepository.save(entry);
        return toResponse(entry);
    }

    public TimeEntryResponse startTimer(String taskId, String projectId, String userId) {
        String tenantId = getCurrentTenantId();

        // Stop any running timer
        timeEntryRepository.findByTenantIdAndUserIdAndEndTimeIsNull(tenantId, userId)
                .ifPresent(e -> {
                    stopTimer(e.getEntryId(), userId);
                });

        TimeEntry entry = TimeEntry.builder()
                .entryId("TE-" + System.currentTimeMillis())
                .tenantId(tenantId)
                .userId(userId)
                .taskId(taskId)
                .projectId(projectId)
                .startTime(LocalDateTime.now())
                .type(TimeEntryType.NON_BILLABLE)
                .isBillable(false)
                .createdAt(LocalDateTime.now())
                .build();

        return toResponse(timeEntryRepository.save(entry));
    }

    public TimeEntryResponse stopTimer(String entryId, String userId) {
        String tenantId = getCurrentTenantId();
        TimeEntry entry = timeEntryRepository.findByEntryIdAndTenantId(entryId, tenantId)
                .orElseThrow(() -> new RuntimeException("Time entry not found: " + entryId));

        LocalDateTime now = LocalDateTime.now();
        entry.setEndTime(now);
        long minutes = java.time.Duration.between(entry.getStartTime(), now).toMinutes();
        entry.setDurationMinutes((int) minutes);

        return toResponse(timeEntryRepository.save(entry));
    }

    public List<TimeEntryResponse> getEntriesByUser(String userId, LocalDateTime from, LocalDateTime to) {
        String tenantId = getCurrentTenantId();
        List<TimeEntry> entries;
        if (from != null && to != null) {
            entries = timeEntryRepository.findByTenantIdAndUserIdAndStartTimeBetween(tenantId, userId, from, to);
        } else {
            entries = timeEntryRepository.findByTenantIdAndUserId(tenantId, userId);
        }
        return entries.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<TimeEntryResponse> getEntriesByDateRange(LocalDateTime from, LocalDateTime to) {
        String tenantId = getCurrentTenantId();
        return timeEntryRepository.findByTenantIdAndStartTimeBetween(tenantId, from, to)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<WorkloadSummary> getWorkloadSummary(LocalDate date) {
        String tenantId = getCurrentTenantId();
        LocalDateTime from = date.atStartOfDay();
        LocalDateTime to = date.plusDays(7).atStartOfDay();

        List<TimeEntry> entries = timeEntryRepository.findByTenantIdAndStartTimeBetween(tenantId, from, to);
        List<ProjectTask> tasks = taskRepository.findByTenantIdAndIsDeletedFalse(tenantId);

        Map<String, List<TimeEntry>> entriesByUser = entries.stream()
                .collect(Collectors.groupingBy(TimeEntry::getUserId));

        Map<String, List<ProjectTask>> tasksByAssignee = new java.util.HashMap<>();
        for (ProjectTask task : tasks) {
            if (task.getAssigneeIds() != null) {
                for (String assigneeId : task.getAssigneeIds()) {
                    tasksByAssignee.computeIfAbsent(assigneeId, k -> new ArrayList<>()).add(task);
                }
            }
        }

        java.util.Set<String> allUserIds = new java.util.HashSet<>(entriesByUser.keySet());
        allUserIds.addAll(tasksByAssignee.keySet());

        return allUserIds.stream().map(userId -> {
            List<TimeEntry> userEntries = entriesByUser.getOrDefault(userId, new ArrayList<>());
            List<ProjectTask> userTasks = tasksByAssignee.getOrDefault(userId, new ArrayList<>());

            int totalMinutes = userEntries.stream()
                    .mapToInt(e -> e.getDurationMinutes() != null ? e.getDurationMinutes() : 0)
                    .sum();

            long completed = userTasks.stream()
                    .filter(t -> t.getStatus() == TaskStatus.DONE).count();

            double pendingHours = userTasks.stream()
                    .filter(t -> t.getStatus() != TaskStatus.DONE && t.getEstimatedHours() != null)
                    .mapToDouble(ProjectTask::getEstimatedHours).sum();

            return WorkloadSummary.builder()
                    .userId(userId)
                    .userName(userId)
                    .assignedTasks(userTasks.size())
                    .completedTasks(completed)
                    .totalHoursLogged(totalMinutes / 60)
                    .pendingHours(pendingHours)
                    .build();
        }).collect(Collectors.toList());
    }

    private TimeEntryResponse toResponse(TimeEntry entry) {
        return TimeEntryResponse.builder()
                .id(entry.getId())
                .entryId(entry.getEntryId())
                .tenantId(entry.getTenantId())
                .userId(entry.getUserId())
                .taskId(entry.getTaskId())
                .projectId(entry.getProjectId())
                .description(entry.getDescription())
                .startTime(entry.getStartTime())
                .endTime(entry.getEndTime())
                .durationMinutes(entry.getDurationMinutes())
                .type(entry.getType())
                .isBillable(entry.isBillable())
                .createdAt(entry.getCreatedAt())
                .build();
    }
}
