package com.ultron.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.ultron.backend.domain.enums.ProjectStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProjectResponse {

    private String id;
    private String projectId;
    private String tenantId;
    private String name;
    private String description;
    private ProjectStatus status;
    private String ownerId;
    private List<String> memberIds;
    private LocalDate startDate;
    private LocalDate dueDate;
    private BigDecimal budget;
    private List<String> milestones;
    private List<String> tags;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
