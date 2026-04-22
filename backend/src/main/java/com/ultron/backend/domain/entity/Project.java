package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.ProjectStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "projects")
public class Project {

    @Id
    private String id;

    @Indexed(unique = true)
    private String projectId;

    @Indexed
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

    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
