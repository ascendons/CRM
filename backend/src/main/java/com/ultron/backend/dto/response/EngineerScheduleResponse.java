package com.ultron.backend.dto.response;

import com.ultron.backend.domain.enums.EngineerAvailability;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class EngineerScheduleResponse {
    private String id;
    private String engineerId;
    private LocalDate date;
    private EngineerAvailability availability;
    private List<SlotResponse> slots;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    public static class SlotResponse {
        private String workOrderId;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private String status;
    }
}
