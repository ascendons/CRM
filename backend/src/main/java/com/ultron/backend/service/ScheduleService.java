package com.ultron.backend.service;

import com.ultron.backend.domain.entity.EngineerSchedule;
import com.ultron.backend.domain.enums.EngineerAvailability;
import com.ultron.backend.dto.request.UpdateScheduleRequest;
import com.ultron.backend.dto.response.EngineerScheduleResponse;
import com.ultron.backend.repository.EngineerScheduleRepository;
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
public class ScheduleService extends BaseTenantService {

    private final EngineerScheduleRepository scheduleRepository;

    public EngineerScheduleResponse getOrCreateSchedule(String engineerId, LocalDate date) {
        String tenantId = getCurrentTenantId();
        EngineerSchedule schedule = scheduleRepository
                .findByTenantIdAndEngineerIdAndDate(tenantId, engineerId, date)
                .orElseGet(() -> createDefault(tenantId, engineerId, date));
        return toResponse(schedule);
    }

    public List<EngineerScheduleResponse> getDaySchedules(LocalDate date) {
        return scheduleRepository.findByTenantIdAndDate(getCurrentTenantId(), date)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<EngineerScheduleResponse> getEngineerSchedules(String engineerId, LocalDate from, LocalDate to) {
        return scheduleRepository.findByTenantIdAndEngineerIdAndDateBetween(getCurrentTenantId(), engineerId, from, to)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<EngineerScheduleResponse> getAvailableEngineers(LocalDate date) {
        return scheduleRepository.findByTenantIdAndAvailabilityAndDate(
                        getCurrentTenantId(), EngineerAvailability.AVAILABLE, date)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public EngineerScheduleResponse updateSchedule(String engineerId, LocalDate date,
                                                    UpdateScheduleRequest request, String userId) {
        String tenantId = getCurrentTenantId();
        EngineerSchedule schedule = scheduleRepository
                .findByTenantIdAndEngineerIdAndDate(tenantId, engineerId, date)
                .orElseGet(() -> createDefault(tenantId, engineerId, date));

        if (request.getAvailability() != null) {
            schedule.setAvailability(request.getAvailability());
        }
        if (request.getSlots() != null) {
            schedule.setSlots(request.getSlots().stream()
                    .map(s -> EngineerSchedule.ScheduleSlot.builder()
                            .workOrderId(s.getWorkOrderId())
                            .startTime(s.getStartTime())
                            .endTime(s.getEndTime())
                            .status(s.getStatus())
                            .build())
                    .collect(Collectors.toList()));
        }
        schedule.setUpdatedAt(LocalDateTime.now());
        schedule.setUpdatedBy(userId);
        return toResponse(scheduleRepository.save(schedule));
    }

    private EngineerSchedule createDefault(String tenantId, String engineerId, LocalDate date) {
        EngineerSchedule s = EngineerSchedule.builder()
                .tenantId(tenantId)
                .engineerId(engineerId)
                .date(date)
                .availability(EngineerAvailability.AVAILABLE)
                .createdAt(LocalDateTime.now())
                .build();
        return scheduleRepository.save(s);
    }

    private EngineerScheduleResponse toResponse(EngineerSchedule s) {
        List<EngineerScheduleResponse.SlotResponse> slots = null;
        if (s.getSlots() != null) {
            slots = s.getSlots().stream()
                    .map(slot -> EngineerScheduleResponse.SlotResponse.builder()
                            .workOrderId(slot.getWorkOrderId())
                            .startTime(slot.getStartTime())
                            .endTime(slot.getEndTime())
                            .status(slot.getStatus())
                            .build())
                    .collect(Collectors.toList());
        }
        return EngineerScheduleResponse.builder()
                .id(s.getId())
                .engineerId(s.getEngineerId())
                .date(s.getDate())
                .availability(s.getAvailability())
                .slots(slots)
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
