package com.ultron.backend.service;

import com.ultron.backend.domain.entity.RateContract;
import com.ultron.backend.dto.request.CreateRateContractRequest;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.RateContractRepository;
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
public class RateContractService extends BaseTenantService {

    private final RateContractRepository rateContractRepository;

    public RateContract create(CreateRateContractRequest request, String userId) {
        List<RateContract.RateContractItem> items = request.getLineItems().stream()
                .map(i -> RateContract.RateContractItem.builder()
                        .partId(i.getPartId()).agreedUnitPrice(i.getAgreedUnitPrice())
                        .minOrderQty(i.getMinOrderQty()).build())
                .collect(Collectors.toList());

        RateContract rc = RateContract.builder()
                .rcNumber("RC-" + System.currentTimeMillis())
                .tenantId(getCurrentTenantId())
                .vendorId(request.getVendorId())
                .lineItems(items)
                .validFrom(request.getValidFrom())
                .validTo(request.getValidTo())
                .autoRenew(request.getAutoRenew())
                .status("Active")
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(userId)
                .build();
        rc = rateContractRepository.save(rc);
        log.info("Rate contract created: {} for vendor {} by {}", rc.getRcNumber(), rc.getVendorId(), userId);
        return rc;
    }

    public List<RateContract> getAll() {
        return rateContractRepository.findByTenantIdAndIsDeletedFalse(getCurrentTenantId());
    }

    public List<RateContract> getByVendor(String vendorId) {
        return rateContractRepository.findByTenantIdAndVendorIdAndIsDeletedFalse(getCurrentTenantId(), vendorId);
    }

    public List<RateContract> getActive() {
        return rateContractRepository.findByTenantIdAndStatusAndIsDeletedFalse(getCurrentTenantId(), "Active");
    }

    public RateContract getById(String id) {
        return findById(id);
    }

    public RateContract terminate(String id, String userId) {
        RateContract rc = findById(id);
        rc.setStatus("Terminated");
        rc.setUpdatedAt(LocalDateTime.now());
        rc.setUpdatedBy(userId);
        return rateContractRepository.save(rc);
    }

    public void delete(String id, String userId) {
        RateContract rc = findById(id);
        rc.setDeleted(true);
        rc.setUpdatedAt(LocalDateTime.now());
        rc.setUpdatedBy(userId);
        rateContractRepository.save(rc);
    }

    private RateContract findById(String id) {
        return rateContractRepository.findById(id)
                .filter(r -> r.getTenantId().equals(getCurrentTenantId()) && !r.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Rate contract not found: " + id));
    }
}
