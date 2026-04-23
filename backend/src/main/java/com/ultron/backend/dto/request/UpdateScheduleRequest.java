package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.EngineerAvailability;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class UpdateScheduleRequest {
    private EngineerAvailability availability;
    private List<SlotRequest> slots;

    @Data
    public static class SlotRequest {
        private String workOrderId;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private String status;
    }
}
