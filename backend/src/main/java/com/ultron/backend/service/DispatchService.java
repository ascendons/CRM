package com.ultron.backend.service;

import com.ultron.backend.domain.entity.DispatchAssignment;
import com.ultron.backend.domain.entity.EngineerSchedule;
import com.ultron.backend.domain.entity.WorkOrder;
import com.ultron.backend.domain.enums.EngineerAvailability;
import com.ultron.backend.domain.enums.WorkOrderStatus;
import com.ultron.backend.dto.request.DispatchRequest;
import com.ultron.backend.dto.response.DispatchAssignmentResponse;
import com.ultron.backend.exception.BadRequestException;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.DispatchAssignmentRepository;
import com.ultron.backend.repository.EngineerScheduleRepository;
import com.ultron.backend.repository.WorkOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DispatchService extends BaseTenantService {

    private final DispatchAssignmentRepository dispatchAssignmentRepository;
    private final WorkOrderRepository workOrderRepository;
    private final EngineerScheduleRepository scheduleRepository;

    public List<DispatchAssignmentResponse> dispatch(DispatchRequest request, String userId) {
        String tenantId = getCurrentTenantId();

        WorkOrder wo = workOrderRepository.findById(request.getWorkOrderId())
                .filter(w -> w.getTenantId().equals(tenantId) && !w.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Work order not found: " + request.getWorkOrderId()));

        List<String> engineerIds = request.getEngineerIds();
        if (engineerIds == null || engineerIds.isEmpty()) {
            throw new BadRequestException("At least one engineer must be specified for dispatch");
        }

        List<DispatchAssignment> assignments = new ArrayList<>();
        for (String engineerId : engineerIds) {
            DispatchAssignment assignment = DispatchAssignment.builder()
                    .tenantId(tenantId)
                    .workOrderId(request.getWorkOrderId())
                    .engineerId(engineerId)
                    .dispatchedAt(LocalDateTime.now())
                    .estimatedArrival(request.getEstimatedArrival())
                    .gpsOnDispatch(request.getGpsLat() != null && request.getGpsLng() != null
                            ? DispatchAssignment.GpsPoint.builder()
                                    .lat(request.getGpsLat()).lng(request.getGpsLng()).build()
                            : null)
                    .createdAt(LocalDateTime.now())
                    .createdBy(userId)
                    .build();
            assignments.add(dispatchAssignmentRepository.save(assignment));

            updateEngineerAvailability(tenantId, engineerId, EngineerAvailability.ON_JOB, userId);
        }

        wo.setAssignedEngineerIds(engineerIds);
        if (wo.getStatus() == WorkOrderStatus.OPEN) {
            wo.setStatus(WorkOrderStatus.ASSIGNED);
        }
        wo.setUpdatedAt(LocalDateTime.now());
        wo.setUpdatedBy(userId);
        workOrderRepository.save(wo);

        log.info("Dispatched {} engineers to WO {} by {}", engineerIds.size(), request.getWorkOrderId(), userId);
        return assignments.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<DispatchAssignmentResponse> reassign(DispatchRequest request, String userId) {
        String tenantId = getCurrentTenantId();

        DispatchAssignment previous = dispatchAssignmentRepository
                .findTopByTenantIdAndWorkOrderIdOrderByDispatchedAtDesc(tenantId, request.getWorkOrderId())
                .orElse(null);

        if (previous != null) {
            updateEngineerAvailability(tenantId, previous.getEngineerId(), EngineerAvailability.AVAILABLE, userId);
        }

        return dispatch(request, userId);
    }

    public List<DispatchAssignmentResponse> getByWorkOrder(String workOrderId) {
        return dispatchAssignmentRepository.findByTenantIdAndWorkOrderId(getCurrentTenantId(), workOrderId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<DispatchAssignmentResponse> getByEngineer(String engineerId) {
        return dispatchAssignmentRepository.findByTenantIdAndEngineerId(getCurrentTenantId(), engineerId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    private void updateEngineerAvailability(String tenantId, String engineerId,
                                             EngineerAvailability availability, String userId) {
        LocalDate today = LocalDate.now();
        EngineerSchedule schedule = scheduleRepository
                .findByTenantIdAndEngineerIdAndDate(tenantId, engineerId, today)
                .orElse(null);

        if (schedule != null) {
            schedule.setAvailability(availability);
            schedule.setUpdatedAt(LocalDateTime.now());
            schedule.setUpdatedBy(userId);
            scheduleRepository.save(schedule);
        }
    }

    private DispatchAssignmentResponse toResponse(DispatchAssignment d) {
        return DispatchAssignmentResponse.builder()
                .id(d.getId())
                .workOrderId(d.getWorkOrderId())
                .engineerId(d.getEngineerId())
                .dispatchedAt(d.getDispatchedAt())
                .estimatedArrival(d.getEstimatedArrival())
                .arrivedAt(d.getArrivedAt())
                .departedAt(d.getDepartedAt())
                .gpsLat(d.getGpsOnDispatch() != null ? d.getGpsOnDispatch().getLat() : null)
                .gpsLng(d.getGpsOnDispatch() != null ? d.getGpsOnDispatch().getLng() : null)
                .reassignReason(d.getReassignReason())
                .createdAt(d.getCreatedAt())
                .createdBy(d.getCreatedBy())
                .build();
    }
}
