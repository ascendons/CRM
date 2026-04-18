package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.EngineerAvailability;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "engineer_schedules")
@CompoundIndex(name = "engineer_date_idx", def = "{'tenantId': 1, 'engineerId': 1, 'date': 1}")
public class EngineerSchedule {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    private String engineerId;
    private LocalDate date;
    private List<ScheduleSlot> slots;
    private EngineerAvailability availability;

    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScheduleSlot {
        private String workOrderId;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private String status;
    }
}
