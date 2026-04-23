package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Objective;
import com.ultron.backend.dto.performance.CreateObjectiveRequest;
import com.ultron.backend.dto.performance.UpdateKeyResultRequest;
import com.ultron.backend.repository.ObjectiveRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service @RequiredArgsConstructor @Slf4j
public class OkrService extends BaseTenantService {
    private final ObjectiveRepository objectiveRepo;

    public Objective createObjective(CreateObjectiveRequest req, String userId) {
        String tenantId = getCurrentTenantId();
        Objective obj = Objective.builder()
                .objectiveId("OKR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .tenantId(tenantId).title(req.getTitle()).ownerId(req.getOwnerId())
                .quarter(req.getQuarter()).year(req.getYear()).keyResults(req.getKeyResults())
                .progress(0.0).isDeleted(false)
                .createdAt(LocalDateTime.now()).createdBy(userId)
                .updatedAt(LocalDateTime.now()).updatedBy(userId).build();
        return objectiveRepo.save(obj);
    }

    public List<Objective> getObjectives() {
        return objectiveRepo.findByTenantIdAndIsDeletedFalse(getCurrentTenantId());
    }

    public Objective getObjective(String objectiveId) {
        return objectiveRepo.findByObjectiveIdAndTenantIdAndIsDeletedFalse(objectiveId, getCurrentTenantId())
                .orElseThrow(() -> new RuntimeException("Objective not found"));
    }

    public Objective updateKeyResult(String objectiveId, int krIndex, UpdateKeyResultRequest req, String userId) {
        Objective obj = getObjective(objectiveId);
        if (obj.getKeyResults() == null || krIndex >= obj.getKeyResults().size())
            throw new RuntimeException("Key result not found");
        obj.getKeyResults().get(krIndex).setCurrentValue(req.getCurrentValue());
        // Recompute progress
        double progress = obj.getKeyResults().stream()
                .filter(kr -> kr.getTargetValue() != null && kr.getTargetValue() > 0)
                .mapToDouble(kr -> Math.min(100, (kr.getCurrentValue() != null ? kr.getCurrentValue() : 0) / kr.getTargetValue() * 100))
                .average().orElse(0.0);
        obj.setProgress(progress);
        obj.setUpdatedAt(LocalDateTime.now()); obj.setUpdatedBy(userId);
        return objectiveRepo.save(obj);
    }

    public void deleteObjective(String objectiveId, String userId) {
        Objective obj = getObjective(objectiveId);
        obj.setDeleted(true); obj.setUpdatedAt(LocalDateTime.now()); obj.setUpdatedBy(userId);
        objectiveRepo.save(obj);
    }
}
