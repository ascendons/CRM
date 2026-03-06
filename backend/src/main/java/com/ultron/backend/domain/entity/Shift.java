package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.ShiftType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "shifts")
@CompoundIndexes({
    @CompoundIndex(name = "shiftId_tenantId_unique", def = "{'shiftId': 1, 'tenantId': 1}", unique = true),
    @CompoundIndex(name = "tenantId_isDefault", def = "{'tenantId': 1, 'isDefault': 1}"),
    @CompoundIndex(name = "tenantId_isDeleted", def = "{'tenantId': 1, 'isDeleted': 1}")
})
public class Shift {

    @Id
    private String id;

    // Business ID (SFT-YYYY-MM-XXXXX)
    private String shiftId;

    // Multi-tenancy
    @Indexed
    private String tenantId;

    // Shift Details
    private String name; // "General Shift", "Night Shift", "Flexible"
    private String description;
    private String code; // SHORT_CODE like "GEN", "NIGHT", "FLEX"

    // Timing
    private LocalTime startTime; // e.g., 09:00
    private LocalTime endTime; // e.g., 18:00
    private Integer workHoursMinutes; // e.g., 540 (9 hours)

    // Flexibility
    private ShiftType type; // FIXED, FLEXIBLE, ROTATIONAL
    private Integer graceMinutes; // Late arrival grace period (e.g., 15 minutes)
    private Integer flexibleStartMinutes; // Flexible start window (e.g., 60 minutes)
    private Integer flexibleEndMinutes; // Flexible end window

    // Break Configuration
    private Integer mandatoryBreakMinutes; // e.g., 60 minutes for lunch
    private Integer maxBreakMinutes; // Max allowed break time

    // Week Configuration
    private List<DayOfWeek> workingDays; // [MONDAY, TUESDAY, ...]
    private List<DayOfWeek> weekendDays; // [SATURDAY, SUNDAY]

    // Overtime Rules
    @Builder.Default
    private Boolean allowOvertime = false;
    private Integer maxOvertimeMinutesPerDay;
    private Integer minOvertimeMinutes; // Minimum minutes for overtime (e.g., 30)

    // Default Shift
    @Builder.Default
    private Boolean isDefault = false; // Default shift for new users
    @Builder.Default
    private Boolean isActive = true;

    // Soft Delete
    @Builder.Default
    private Boolean isDeleted = false;

    // Audit Fields
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    private String createdBy;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
}
