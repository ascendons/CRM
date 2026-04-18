package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Contract;
import com.ultron.backend.domain.entity.ContractVisit;
import com.ultron.backend.domain.enums.ContractVisitStatus;
import com.ultron.backend.repository.ContractVisitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContractVisitService extends BaseTenantService {

    private final ContractVisitRepository visitRepository;

    public List<ContractVisit> getByContract(String contractId) {
        return visitRepository.findByContractIdAndTenantId(contractId, getCurrentTenantId());
    }

    public List<ContractVisit> generateVisits(Contract contract, String userId) {
        String tenantId = getCurrentTenantId();
        int frequency = contract.getVisitFrequencyPerYear() != null ? contract.getVisitFrequencyPerYear() : 0;
        if (frequency <= 0) return new ArrayList<>();

        // Check if visits already exist
        List<ContractVisit> existing = visitRepository.findByContractIdAndTenantId(contract.getId(), tenantId);
        if (!existing.isEmpty()) return existing;

        List<ContractVisit> visits = new ArrayList<>();
        long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(contract.getStartDate(), contract.getEndDate());
        long interval = daysBetween / frequency;

        for (int i = 1; i <= frequency; i++) {
            ContractVisit visit = ContractVisit.builder()
                    .tenantId(tenantId)
                    .contractId(contract.getId())
                    .visitNumber(i)
                    .scheduledDate(contract.getStartDate().plusDays(interval * i))
                    .status(ContractVisitStatus.SCHEDULED)
                    .createdAt(LocalDateTime.now())
                    .createdBy(userId)
                    .build();
            visits.add(visitRepository.save(visit));
        }
        log.info("Generated {} visits for contract {}", frequency, contract.getId());
        return visits;
    }

    public ContractVisit updateVisit(String id, ContractVisit update, String userId) {
        ContractVisit existing = visitRepository.findById(id)
                .filter(v -> v.getTenantId().equals(getCurrentTenantId()))
                .orElseThrow(() -> new RuntimeException("Visit not found: " + id));
        
        existing.setScheduledDate(update.getScheduledDate());
        existing.setActualDate(update.getActualDate());
        existing.setEngineerId(update.getEngineerId());
        existing.setWorkOrderId(update.getWorkOrderId());
        existing.setStatus(update.getStatus());
        existing.setNotes(update.getNotes());
        existing.setUpdatedAt(LocalDateTime.now());
        existing.setUpdatedBy(userId);
        
        return visitRepository.save(existing);
    }
}
