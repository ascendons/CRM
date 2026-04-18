package com.ultron.backend.service;

import com.ultron.backend.domain.entity.EngineerLocation;
import com.ultron.backend.domain.entity.WorkOrder;
import com.ultron.backend.domain.entity.WorkOrderGeoEvent;
import com.ultron.backend.domain.enums.WorkOrderStatus;
import com.ultron.backend.dto.request.LocationUpdateRequest;
import com.ultron.backend.dto.response.EngineerLocationResponse;
import com.ultron.backend.repository.EngineerLocationRepository;
import com.ultron.backend.repository.WorkOrderGeoEventRepository;
import com.ultron.backend.repository.WorkOrderRepository;
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
public class GeoTrackingService extends BaseTenantService {

    private final EngineerLocationRepository locationRepository;
    private final WorkOrderGeoEventRepository geoEventRepository;
    private final WorkOrderRepository workOrderRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public EngineerLocationResponse updateLocation(String engineerId, LocationUpdateRequest request) {
        String tenantId = getCurrentTenantId();

        EngineerLocation location = EngineerLocation.builder()
                .tenantId(tenantId)
                .engineerId(engineerId)
                .lat(request.getLat())
                .lng(request.getLng())
                .accuracy(request.getAccuracy())
                .timestamp(LocalDateTime.now())
                .workOrderId(request.getWorkOrderId())
                .batteryLevel(request.getBatteryLevel())
                .build();

        locationRepository.save(location);

        EngineerLocationResponse response = toResponse(location);
        messagingTemplate.convertAndSend("/topic/engineer-location/" + tenantId + "/" + engineerId, response);

        log.debug("Location updated for engineer {} in tenant {}", engineerId, tenantId);
        return response;
    }

    public EngineerLocationResponse getLatestLocation(String engineerId) {
        return locationRepository
                .findTopByTenantIdAndEngineerIdOrderByTimestampDesc(getCurrentTenantId(), engineerId)
                .map(this::toResponse)
                .orElse(null);
    }

    public void recordGeoEvent(String workOrderId, String engineerId, String eventType,
                                Double lat, Double lng, String userId) {
        String tenantId = getCurrentTenantId();

        WorkOrderGeoEvent event = WorkOrderGeoEvent.builder()
                .tenantId(tenantId)
                .workOrderId(workOrderId)
                .engineerId(engineerId)
                .eventType(eventType)
                .lat(lat)
                .lng(lng)
                .timestamp(LocalDateTime.now())
                .geofenceMatch(false)
                .spoofDetected(false)
                .build();

        geoEventRepository.save(event);

        if ("Arrived".equals(eventType)) {
            workOrderRepository.findById(workOrderId)
                    .filter(wo -> wo.getTenantId().equals(tenantId) && !wo.isDeleted()
                            && wo.getStatus() == WorkOrderStatus.EN_ROUTE)
                    .ifPresent(wo -> {
                        wo.setStatus(WorkOrderStatus.ON_SITE);
                        wo.setUpdatedAt(LocalDateTime.now());
                        wo.setUpdatedBy(userId);
                        workOrderRepository.save(wo);
                        log.info("WO {} auto-updated to ON_SITE on engineer arrival", workOrderId);
                    });
        }

        messagingTemplate.convertAndSend("/topic/geo-events/" + tenantId, event);
    }

    public List<WorkOrderGeoEvent> getGeoEvents(String workOrderId) {
        return geoEventRepository.findByTenantIdAndWorkOrderIdOrderByTimestampAsc(
                getCurrentTenantId(), workOrderId);
    }

    private EngineerLocationResponse toResponse(EngineerLocation l) {
        return EngineerLocationResponse.builder()
                .engineerId(l.getEngineerId())
                .lat(l.getLat())
                .lng(l.getLng())
                .accuracy(l.getAccuracy())
                .timestamp(l.getTimestamp())
                .workOrderId(l.getWorkOrderId())
                .batteryLevel(l.getBatteryLevel())
                .build();
    }
}
