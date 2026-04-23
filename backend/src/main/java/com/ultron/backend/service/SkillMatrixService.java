package com.ultron.backend.service;

import com.ultron.backend.domain.entity.TechnicianSkill;
import com.ultron.backend.domain.entity.TrainingRecord;
import com.ultron.backend.dto.request.CreateTechnicianSkillRequest;
import com.ultron.backend.dto.request.CreateTrainingRecordRequest;
import com.ultron.backend.dto.response.TechnicianSkillResponse;
import com.ultron.backend.dto.response.TrainingRecordResponse;
import com.ultron.backend.dto.response.EngineerSkillProfileResponse;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.TechnicianSkillRepository;
import com.ultron.backend.repository.TrainingRecordRepository;
import com.ultron.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SkillMatrixService extends BaseTenantService {

    private final TechnicianSkillRepository skillRepository;
    private final TrainingRecordRepository trainingRepository;
    private final UserRepository userRepository;

    public TechnicianSkillResponse addSkill(CreateTechnicianSkillRequest request, String userId) {
        String tenantId = getCurrentTenantId();
        TechnicianSkill skill = TechnicianSkill.builder()
                .tenantId(tenantId)
                .userId(request.getUserId())
                .skillName(request.getSkillName())
                .certificationBody(request.getCertificationBody())
                .certNumber(request.getCertNumber())
                .issueDate(request.getIssueDate())
                .expiryDate(request.getExpiryDate())
                .verifiedBy(request.getVerifiedBy())
                .proficiencyLevel(request.getProficiencyLevel())
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(userId)
                .build();
        return toSkillResponse(skillRepository.save(skill));
    }

    public List<TechnicianSkillResponse> getSkillsByUser(String userId) {
        return skillRepository.findByTenantIdAndUserIdAndIsDeletedFalse(getCurrentTenantId(), userId)
                .stream().map(this::toSkillResponse).collect(Collectors.toList());
    }

    public List<TechnicianSkillResponse> getBySkillName(String skillName) {
        return skillRepository.findByTenantIdAndSkillNameAndIsDeletedFalse(getCurrentTenantId(), skillName)
                .stream().map(this::toSkillResponse).collect(Collectors.toList());
    }

    public List<TechnicianSkillResponse> getExpiringCertifications(int daysAhead) {
        LocalDate cutoff = LocalDate.now().plusDays(daysAhead);
        return skillRepository.findByTenantIdAndExpiryDateBeforeAndIsDeletedFalse(getCurrentTenantId(), cutoff)
                .stream().map(this::toSkillResponse).collect(Collectors.toList());
    }

    public void deleteSkill(String id, String userId) {
        String tenantId = getCurrentTenantId();
        TechnicianSkill skill = skillRepository.findById(id)
                .filter(s -> s.getTenantId().equals(tenantId) && !s.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found: " + id));
        skill.setDeleted(true);
        skill.setUpdatedAt(LocalDateTime.now());
        skill.setUpdatedBy(userId);
        skillRepository.save(skill);
    }

    public TrainingRecordResponse addTraining(CreateTrainingRecordRequest request, String userId) {
        TrainingRecord record = TrainingRecord.builder()
                .tenantId(getCurrentTenantId())
                .userId(request.getUserId())
                .trainingName(request.getTrainingName())
                .trainingType(request.getTrainingType())
                .completedDate(request.getCompletedDate())
                .trainerName(request.getTrainerName())
                .score(request.getScore())
                .passed(request.getPassed())
                .certAttachmentUrl(request.getCertAttachmentUrl())
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(userId)
                .build();
        return toTrainingResponse(trainingRepository.save(record));
    }

    public List<EngineerSkillProfileResponse> getAllEngineers() {
        String tenantId = getCurrentTenantId();
        List<TechnicianSkill> allSkills = skillRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        List<TrainingRecord> allTraining = trainingRepository.findByTenantIdAndIsDeletedFalse(tenantId);

        Map<String, EngineerSkillProfileResponse> byUser = new LinkedHashMap<>();

        for (TechnicianSkill s : allSkills) {
            byUser.computeIfAbsent(s.getUserId(), uid -> {
                String name = userRepository.findById(uid)
                        .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername()).orElse(uid);
                return EngineerSkillProfileResponse.builder()
                        .engineerId(uid).engineerName(name)
                        .skills(new ArrayList<>()).trainingRecords(new ArrayList<>()).build();
            }).getSkills().add(toSkillResponse(s));
        }

        for (TrainingRecord r : allTraining) {
            byUser.computeIfAbsent(r.getUserId(), uid -> {
                String name = userRepository.findById(uid)
                        .map(u -> u.getFullName() != null ? u.getFullName() : u.getUsername()).orElse(uid);
                return EngineerSkillProfileResponse.builder()
                        .engineerId(uid).engineerName(name)
                        .skills(new ArrayList<>()).trainingRecords(new ArrayList<>()).build();
            }).getTrainingRecords().add(toTrainingResponse(r));
        }

        return new ArrayList<>(byUser.values());
    }

    public List<TrainingRecordResponse> getTrainingByUser(String userId) {
        return trainingRepository.findByTenantIdAndUserIdAndIsDeletedFalse(getCurrentTenantId(), userId)
                .stream().map(this::toTrainingResponse).collect(Collectors.toList());
    }

    private TechnicianSkillResponse toSkillResponse(TechnicianSkill s) {
        return TechnicianSkillResponse.builder()
                .id(s.getId())
                .userId(s.getUserId())
                .skillName(s.getSkillName())
                .certificationBody(s.getCertificationBody())
                .certNumber(s.getCertNumber())
                .issueDate(s.getIssueDate())
                .expiryDate(s.getExpiryDate())
                .verifiedBy(s.getVerifiedBy())
                .proficiencyLevel(s.getProficiencyLevel())
                .createdAt(s.getCreatedAt())
                .createdBy(s.getCreatedBy())
                .build();
    }

    private TrainingRecordResponse toTrainingResponse(TrainingRecord r) {
        return TrainingRecordResponse.builder()
                .id(r.getId())
                .userId(r.getUserId())
                .trainingName(r.getTrainingName())
                .trainingType(r.getTrainingType())
                .completedDate(r.getCompletedDate())
                .trainerName(r.getTrainerName())
                .score(r.getScore())
                .passed(r.getPassed())
                .certAttachmentUrl(r.getCertAttachmentUrl())
                .createdAt(r.getCreatedAt())
                .createdBy(r.getCreatedBy())
                .build();
    }
}
