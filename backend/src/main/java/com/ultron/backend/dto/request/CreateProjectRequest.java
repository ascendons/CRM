package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class CreateProjectRequest {

    @NotBlank(message = "Project name is required")
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
}
