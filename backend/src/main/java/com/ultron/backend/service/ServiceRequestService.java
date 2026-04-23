package com.ultron.backend.service;

import com.ultron.backend.domain.entity.ServiceRequest;
import com.ultron.backend.domain.enums.ServiceRequestStatus;
import com.ultron.backend.dto.request.CreateServiceRequestRequest;
import com.ultron.backend.dto.response.ServiceRequestResponse;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.ServiceRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServiceRequestService extends BaseTenantService {

    private final ServiceRequestRepository srRepository;
    private final ServiceRequestIdGeneratorService idGeneratorService;

    public ServiceRequestResponse create(CreateServiceRequestRequest request, String userId) {
        String tenantId = getCurrentTenantId();
        ServiceRequest sr = ServiceRequest.builder()
                .srNumber(idGeneratorService.generateServiceRequestId())
                .tenantId(tenantId)
                .source(request.getSource())
                .accountId(request.getAccountId())
                .contactId(request.getContactId())
                .assetId(request.getAssetId())
                .description(request.getDescription())
                .priority(request.getPriority())
                .status(ServiceRequestStatus.OPEN)
                .slaDeadline(LocalDateTime.now().plusHours(4)) // default 4h SLA for SR acknowledgement
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(userId)
                .build();
        sr = srRepository.save(sr);
        log.info("Service request created: {} by {}", sr.getSrNumber(), userId);
        return toResponse(sr);
    }

    public List<ServiceRequestResponse> getAll() {
        return srRepository.findByTenantIdAndIsDeletedFalse(getCurrentTenantId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public ServiceRequestResponse getById(String id) {
        return toResponse(findById(id));
    }

    public ServiceRequestResponse acknowledge(String id, String userId) {
        ServiceRequest sr = findById(id);
        sr.setStatus(ServiceRequestStatus.ACKNOWLEDGED);
        sr.setAcknowledgedAt(LocalDateTime.now());
        sr.setUpdatedAt(LocalDateTime.now());
        sr.setUpdatedBy(userId);
        return toResponse(srRepository.save(sr));
    }

    public ServiceRequestResponse linkWorkOrder(String id, String workOrderId, String userId) {
        ServiceRequest sr = findById(id);
        sr.setWorkOrderId(workOrderId);
        sr.setStatus(ServiceRequestStatus.WO_CREATED);
        sr.setUpdatedAt(LocalDateTime.now());
        sr.setUpdatedBy(userId);
        return toResponse(srRepository.save(sr));
    }

    public ServiceRequestResponse resolve(String id, String userId) {
        ServiceRequest sr = findById(id);
        sr.setStatus(ServiceRequestStatus.RESOLVED);
        sr.setResolvedAt(LocalDateTime.now());
        sr.setUpdatedAt(LocalDateTime.now());
        sr.setUpdatedBy(userId);
        return toResponse(srRepository.save(sr));
    }

    public ServiceRequestResponse close(String id, String userId) {
        ServiceRequest sr = findById(id);
        sr.setStatus(ServiceRequestStatus.CLOSED);
        sr.setUpdatedAt(LocalDateTime.now());
        sr.setUpdatedBy(userId);
        return toResponse(srRepository.save(sr));
    }

    private ServiceRequest findById(String id) {
        return srRepository.findById(id)
                .filter(s -> s.getTenantId().equals(getCurrentTenantId()) && !s.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Service request not found: " + id));
    }

    private ServiceRequestResponse toResponse(ServiceRequest s) {
        return ServiceRequestResponse.builder()
                .id(s.getId())
                .srNumber(s.getSrNumber())
                .source(s.getSource())
                .accountId(s.getAccountId())
                .contactId(s.getContactId())
                .assetId(s.getAssetId())
                .description(s.getDescription())
                .priority(s.getPriority())
                .status(s.getStatus())
                .workOrderId(s.getWorkOrderId())
                .slaDeadline(s.getSlaDeadline())
                .acknowledgedAt(s.getAcknowledgedAt())
                .resolvedAt(s.getResolvedAt())
                .createdAt(s.getCreatedAt())
                .createdBy(s.getCreatedBy())
                .updatedAt(s.getUpdatedAt())
                .updatedBy(s.getUpdatedBy())
                .build();
    }
}
