package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Contract;
import com.ultron.backend.domain.enums.ContractStatus;
import com.ultron.backend.dto.request.CreateContractRequest;
import com.ultron.backend.dto.response.ContractResponse;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.ContractRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContractService extends BaseTenantService {

    private final ContractRepository contractRepository;
    private final ContractIdGeneratorService idGeneratorService;

    public ContractResponse create(CreateContractRequest request, String userId) {
        String tenantId = getCurrentTenantId();

        Contract.SlaConfig slaConfig = Contract.SlaConfig.builder()
                .responseHrs(request.getSlaResponseHrs())
                .resolutionHrs(request.getSlaResolutionHrs())
                .build();

        Contract.PenaltyConfig penaltyConfig = Contract.PenaltyConfig.builder()
                .perHourBreachPenalty(request.getPerHourBreachPenalty())
                .maxPenaltyCap(request.getMaxPenaltyCap())
                .build();

        Contract contract = Contract.builder()
                .contractNumber(idGeneratorService.generateContractId())
                .tenantId(tenantId)
                .type(request.getType())
                .accountId(request.getAccountId())
                .assetIds(request.getAssetIds())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .billingCycle(request.getBillingCycle())
                .visitFrequencyPerYear(request.getVisitFrequencyPerYear())
                .contractValue(request.getContractValue())
                .slaConfig(slaConfig)
                .penaltyConfig(penaltyConfig)
                .status(ContractStatus.DRAFT)
                .notes(request.getNotes())
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(userId)
                .build();

        contract = contractRepository.save(contract);
        log.info("Contract created: {} by {}", contract.getContractNumber(), userId);
        return toResponse(contract);
    }

    public List<ContractResponse> getAll() {
        return contractRepository.findByTenantIdAndIsDeletedFalse(getCurrentTenantId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ContractResponse> getByAccount(String accountId) {
        return contractRepository.findByTenantIdAndAccountIdAndIsDeletedFalse(getCurrentTenantId(), accountId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ContractResponse> getExpiringSoon(int days) {
        LocalDate threshold = LocalDate.now().plusDays(days);
        return contractRepository.findByTenantIdAndEndDateBetweenAndIsDeletedFalse(
                        getCurrentTenantId(), LocalDate.now(), threshold)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public ContractResponse getById(String id) {
        return toResponse(findById(id));
    }

    public ContractResponse activate(String id, String userId) {
        Contract contract = findById(id);
        contract.setStatus(ContractStatus.ACTIVE);
        contract.setUpdatedAt(LocalDateTime.now());
        contract.setUpdatedBy(userId);
        return toResponse(contractRepository.save(contract));
    }

    public ContractResponse cancel(String id, String userId) {
        Contract contract = findById(id);
        contract.setStatus(ContractStatus.CANCELLED);
        contract.setUpdatedAt(LocalDateTime.now());
        contract.setUpdatedBy(userId);
        return toResponse(contractRepository.save(contract));
    }

    public ContractResponse renew(String id, CreateContractRequest request, String userId) {
        Contract old = findById(id);
        old.setStatus(ContractStatus.RENEWED);
        old.setUpdatedAt(LocalDateTime.now());
        old.setUpdatedBy(userId);
        contractRepository.save(old);
        // Create new contract copying account + assets
        request.setAccountId(old.getAccountId());
        if (request.getAssetIds() == null) request.setAssetIds(old.getAssetIds());
        return create(request, userId);
    }

    public void delete(String id, String userId) {
        Contract contract = findById(id);
        contract.setDeleted(true);
        contract.setUpdatedAt(LocalDateTime.now());
        contract.setUpdatedBy(userId);
        contractRepository.save(contract);
    }

    public ContractResponse update(String id, CreateContractRequest request, String userId) {
        Contract contract = findById(id);
        
        contract.setType(request.getType());
        contract.setAssetIds(request.getAssetIds());
        contract.setStartDate(request.getStartDate());
        contract.setEndDate(request.getEndDate());
        contract.setBillingCycle(request.getBillingCycle());
        contract.setVisitFrequencyPerYear(request.getVisitFrequencyPerYear());
        contract.setContractValue(request.getContractValue());
        contract.setNotes(request.getNotes());
        
        contract.setSlaConfig(Contract.SlaConfig.builder()
                .responseHrs(request.getSlaResponseHrs())
                .resolutionHrs(request.getSlaResolutionHrs())
                .build());
                
        contract.setPenaltyConfig(Contract.PenaltyConfig.builder()
                .perHourBreachPenalty(request.getPerHourBreachPenalty())
                .maxPenaltyCap(request.getMaxPenaltyCap())
                .build());

        contract.setUpdatedAt(LocalDateTime.now());
        contract.setUpdatedBy(userId);
        
        return toResponse(contractRepository.save(contract));
    }

    private Contract findById(String id) {
        return contractRepository.findById(id)
                .filter(c -> c.getTenantId().equals(getCurrentTenantId()) && !c.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + id));
    }

    private ContractResponse toResponse(Contract c) {
        return ContractResponse.builder()
                .id(c.getId())
                .contractNumber(c.getContractNumber())
                .type(c.getType())
                .accountId(c.getAccountId())
                .assetIds(c.getAssetIds())
                .startDate(c.getStartDate())
                .endDate(c.getEndDate())
                .billingCycle(c.getBillingCycle())
                .visitFrequencyPerYear(c.getVisitFrequencyPerYear())
                .contractValue(c.getContractValue())
                .slaResponseHrs(c.getSlaConfig() != null ? c.getSlaConfig().getResponseHrs() : null)
                .slaResolutionHrs(c.getSlaConfig() != null ? c.getSlaConfig().getResolutionHrs() : null)
                .perHourBreachPenalty(c.getPenaltyConfig() != null ? c.getPenaltyConfig().getPerHourBreachPenalty() : null)
                .maxPenaltyCap(c.getPenaltyConfig() != null ? c.getPenaltyConfig().getMaxPenaltyCap() : null)
                .status(c.getStatus())
                .notes(c.getNotes())
                .createdAt(c.getCreatedAt())
                .createdBy(c.getCreatedBy())
                .updatedAt(c.getUpdatedAt())
                .updatedBy(c.getUpdatedBy())
                .build();
    }
}
