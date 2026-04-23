package com.ultron.backend.service;

import com.ultron.backend.domain.entity.GRN;
import com.ultron.backend.dto.request.CreateGRNRequest;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.GRNRepository;
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
public class GRNService extends BaseTenantService {

    private final GRNRepository grnRepository;

    public GRN create(CreateGRNRequest request, String userId) {
        List<GRN.GRNLineItem> items = request.getLineItems().stream()
                .map(i -> GRN.GRNLineItem.builder()
                        .partId(i.getPartId()).orderedQty(i.getOrderedQty())
                        .receivedQty(i.getReceivedQty()).condition(i.getCondition()).build())
                .collect(Collectors.toList());

        GRN grn = GRN.builder()
                .grnNumber("GRN-" + System.currentTimeMillis())
                .tenantId(getCurrentTenantId())
                .poId(request.getPoId())
                .receivedDate(request.getReceivedDate() != null ? request.getReceivedDate() : LocalDate.now())
                .receivedBy(userId)
                .lineItems(items)
                .qualityStatus(request.getQualityStatus())
                .remarks(request.getRemarks())
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(userId)
                .build();
        grn = grnRepository.save(grn);
        log.info("GRN created: {} for PO {} by {}", grn.getGrnNumber(), grn.getPoId(), userId);
        return grn;
    }

    public List<GRN> getAll() {
        return grnRepository.findByTenantIdAndIsDeletedFalse(getCurrentTenantId());
    }

    public List<GRN> getByPO(String poId) {
        return grnRepository.findByTenantIdAndPoIdAndIsDeletedFalse(getCurrentTenantId(), poId);
    }

    public GRN getById(String id) {
        return findById(id);
    }

    public void delete(String id, String userId) {
        GRN grn = findById(id);
        grn.setDeleted(true);
        grn.setUpdatedAt(LocalDateTime.now());
        grn.setUpdatedBy(userId);
        grnRepository.save(grn);
    }

    private GRN findById(String id) {
        return grnRepository.findById(id)
                .filter(g -> g.getTenantId().equals(getCurrentTenantId()) && !g.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("GRN not found: " + id));
    }
}
