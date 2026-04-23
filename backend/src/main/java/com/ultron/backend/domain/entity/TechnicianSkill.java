package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.ProficiencyLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "technician_skills")
public class TechnicianSkill {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    private String userId;
    private String skillName;
    private String certificationBody;
    private String certNumber;
    private LocalDate issueDate;
    private LocalDate expiryDate;
    private String verifiedBy;
    private ProficiencyLevel proficiencyLevel;

    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
