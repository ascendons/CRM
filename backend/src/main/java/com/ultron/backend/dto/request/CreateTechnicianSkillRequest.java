package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.ProficiencyLevel;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateTechnicianSkillRequest {

    @NotBlank
    private String userId;

    @NotBlank
    private String skillName;

    private String certificationBody;
    private String certNumber;
    private LocalDate issueDate;
    private LocalDate expiryDate;
    private String verifiedBy;
    private ProficiencyLevel proficiencyLevel;
}
