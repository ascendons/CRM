package com.ultron.backend.service;

import com.ultron.backend.domain.entity.PartsRequest;
import com.ultron.backend.domain.enums.PartsRequestStatus;
import com.ultron.backend.dto.request.CreatePartsRequestRequest;
import com.ultron.backend.dto.response.PartsRequestResponse;
import com.ultron.backend.exception.BadRequestException;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.PartsRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PartsRequestService extends BaseTenantService {

    private final PartsRequestRepository partsRequestRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public PartsRequestResponse create(CreatePartsRequestRequest request, String userId) {
        String tenantId = getCurrentTenantId();

        List<PartsRequest.RequestedPart> parts = request.getRequestedParts().stream()
                .map(p -> PartsRequest.RequestedPart.builder()
                        .partId(p.getPartId()).qty(p.getQty()).reason(p.getReason()).build())
                .collect(Collectors.toList());

        PartsRequest pr = PartsRequest.builder()
                .requestNumber("PR-" + System.currentTimeMillis())
                .tenantId(tenantId)
                .workOrderId(request.getWorkOrderId())
                .engineerId(request.getEngineerId())
                .requestedAt(LocalDateTime.now())
                .requestedParts(parts)
                .status(PartsRequestStatus.PENDING)
                .warehouseId(request.getWarehouseId())
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(userId)
                .build();

        pr = partsRequestRepository.save(pr);
        log.info("Parts request {} created for WO {}", pr.getRequestNumber(), request.getWorkOrderId());
        return toResponse(pr);
    }

    public List<PartsRequestResponse> getAll() {
        return partsRequestRepository.findByTenantIdAndIsDeletedFalse(getCurrentTenantId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<PartsRequestResponse> getByWorkOrder(String workOrderId) {
        return partsRequestRepository.findByTenantIdAndWorkOrderIdAndIsDeletedFalse(getCurrentTenantId(), workOrderId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<PartsRequestResponse> getByStatus(PartsRequestStatus status) {
        return partsRequestRepository.findByTenantIdAndStatusAndIsDeletedFalse(getCurrentTenantId(), status)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public PartsRequestResponse getById(String id) {
        return toResponse(findById(id));
    }

    public PartsRequestResponse approve(String id, String warehouseId, String userId) {
        PartsRequest pr = findById(id);
        if (pr.getStatus() != PartsRequestStatus.PENDING) {
            throw new BadRequestException("Parts request is not in PENDING state");
        }
        pr.setStatus(PartsRequestStatus.APPROVED);
        pr.setApprovedBy(userId);
        if (warehouseId != null) pr.setWarehouseId(warehouseId);
        pr.setUpdatedAt(LocalDateTime.now());
        pr.setUpdatedBy(userId);
        pr = partsRequestRepository.save(pr);

        messagingTemplate.convertAndSend(
                "/topic/parts-requests/" + pr.getTenantId() + "/engineer/" + pr.getEngineerId(),
                toResponse(pr));
        return toResponse(pr);
    }

    public PartsRequestResponse reject(String id, String reason, String userId) {
        PartsRequest pr = findById(id);
        if (pr.getStatus() != PartsRequestStatus.PENDING) {
            throw new BadRequestException("Parts request is not in PENDING state");
        }
        pr.setStatus(PartsRequestStatus.REJECTED);
        pr.setRejectionReason(reason);
        pr.setUpdatedAt(LocalDateTime.now());
        pr.setUpdatedBy(userId);
        pr = partsRequestRepository.save(pr);

        messagingTemplate.convertAndSend(
                "/topic/parts-requests/" + pr.getTenantId() + "/engineer/" + pr.getEngineerId(),
                toResponse(pr));
        return toResponse(pr);
    }

    public PartsRequestResponse dispatch(String id, String userId) {
        PartsRequest pr = findById(id);
        if (pr.getStatus() != PartsRequestStatus.APPROVED) {
            throw new BadRequestException("Parts request must be APPROVED before dispatch");
        }
        pr.setStatus(PartsRequestStatus.DISPATCHED);
        pr.setDispatchedAt(LocalDateTime.now());
        pr.setUpdatedAt(LocalDateTime.now());
        pr.setUpdatedBy(userId);
        pr = partsRequestRepository.save(pr);

        messagingTemplate.convertAndSend(
                "/topic/parts-requests/" + pr.getTenantId() + "/engineer/" + pr.getEngineerId(),
                toResponse(pr));
        return toResponse(pr);
    }

    public PartsRequestResponse receive(String id, String userId) {
        PartsRequest pr = findById(id);
        if (pr.getStatus() != PartsRequestStatus.DISPATCHED) {
            throw new BadRequestException("Parts request must be DISPATCHED before receiving");
        }
        pr.setStatus(PartsRequestStatus.RECEIVED);
        pr.setReceivedAt(LocalDateTime.now());
        pr.setUpdatedAt(LocalDateTime.now());
        pr.setUpdatedBy(userId);
        return toResponse(partsRequestRepository.save(pr));
    }

    private PartsRequest findById(String id) {
        return partsRequestRepository.findById(id)
                .filter(pr -> pr.getTenantId().equals(getCurrentTenantId()) && !pr.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Parts request not found: " + id));
    }

    private PartsRequestResponse toResponse(PartsRequest pr) {
        List<PartsRequestResponse.PartItem> parts = null;
        if (pr.getRequestedParts() != null) {
            parts = pr.getRequestedParts().stream()
                    .map(p -> PartsRequestResponse.PartItem.builder()
                            .partId(p.getPartId()).qty(p.getQty()).reason(p.getReason()).build())
                    .collect(Collectors.toList());
        }
        return PartsRequestResponse.builder()
                .id(pr.getId())
                .requestNumber(pr.getRequestNumber())
                .workOrderId(pr.getWorkOrderId())
                .engineerId(pr.getEngineerId())
                .requestedAt(pr.getRequestedAt())
                .requestedParts(parts)
                .status(pr.getStatus())
                .approvedBy(pr.getApprovedBy())
                .warehouseId(pr.getWarehouseId())
                .dispatchedAt(pr.getDispatchedAt())
                .receivedAt(pr.getReceivedAt())
                .rejectionReason(pr.getRejectionReason())
                .createdAt(pr.getCreatedAt())
                .createdBy(pr.getCreatedBy())
                .build();
    }
}
