package com.ultron.backend.service;

import com.ultron.backend.domain.entity.RFQ;
import com.ultron.backend.domain.enums.RFQStatus;
import com.ultron.backend.dto.request.CreateRFQRequest;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.RFQRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RFQService extends BaseTenantService {

    private final RFQRepository rfqRepository;

    public RFQ create(CreateRFQRequest request, String userId) {
        List<RFQ.RFQItem> items = request.getItems().stream()
                .map(i -> RFQ.RFQItem.builder().partId(i.getPartId()).qty(i.getQty()).specs(i.getSpecs()).build())
                .collect(Collectors.toList());

        RFQ rfq = RFQ.builder()
                .rfqNumber("RFQ-" + System.currentTimeMillis())
                .tenantId(getCurrentTenantId())
                .description(request.getDescription())
                .items(items)
                .vendorIds(request.getVendorIds())
                .deadline(request.getDeadline())
                .status(RFQStatus.OPEN)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(userId)
                .build();
        rfq = rfqRepository.save(rfq);
        log.info("RFQ created: {} by {}", rfq.getRfqNumber(), userId);
        return rfq;
    }

    public List<RFQ> getAll() {
        return rfqRepository.findByTenantIdAndIsDeletedFalse(getCurrentTenantId());
    }

    public List<RFQ> getByStatus(RFQStatus status) {
        return rfqRepository.findByTenantIdAndStatusAndIsDeletedFalse(getCurrentTenantId(), status);
    }

    public RFQ getById(String id) {
        return findById(id);
    }

    public RFQ submitVendorResponse(String id, String vendorId, BigDecimal unitPrice,
                                     Integer deliveryDays, String notes, String userId) {
        RFQ rfq = findById(id);
        RFQ.VendorResponse response = RFQ.VendorResponse.builder()
                .vendorId(vendorId).unitPrice(unitPrice)
                .deliveryDays(deliveryDays).notes(notes)
                .submittedAt(LocalDateTime.now()).build();
        if (rfq.getResponses() == null) rfq.setResponses(new java.util.ArrayList<>());
        rfq.getResponses().add(response);
        rfq.setUpdatedAt(LocalDateTime.now());
        rfq.setUpdatedBy(userId);
        return rfqRepository.save(rfq);
    }

    public RFQ selectVendor(String id, String vendorId, String userId) {
        RFQ rfq = findById(id);
        rfq.setSelectedVendorId(vendorId);
        rfq.setStatus(RFQStatus.CLOSED);
        rfq.setUpdatedAt(LocalDateTime.now());
        rfq.setUpdatedBy(userId);
        return rfqRepository.save(rfq);
    }

    public void delete(String id, String userId) {
        RFQ rfq = findById(id);
        rfq.setDeleted(true);
        rfq.setUpdatedAt(LocalDateTime.now());
        rfq.setUpdatedBy(userId);
        rfqRepository.save(rfq);
    }

    private RFQ findById(String id) {
        return rfqRepository.findById(id)
                .filter(r -> r.getTenantId().equals(getCurrentTenantId()) && !r.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("RFQ not found: " + id));
    }
}
