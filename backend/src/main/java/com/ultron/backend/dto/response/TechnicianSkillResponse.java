package com.ultron.backend.dto.response;

import com.ultron.backend.domain.enums.ProficiencyLevel;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class TechnicianSkillResponse {
    private String id;
    private String userId;
    private String skillName;
    private String certificationBody;
    private String certNumber;
    private LocalDate issueDate;
    private LocalDate expiryDate;
    private String verifiedBy;
    private ProficiencyLevel proficiencyLevel;
    private LocalDateTime createdAt;
    private String createdBy;
}
