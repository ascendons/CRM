package com.ultron.backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class EngineerSkillProfileResponse {
    private String engineerId;
    private String engineerName;
    private List<TechnicianSkillResponse> skills;
    private List<TrainingRecordResponse> trainingRecords;
}
