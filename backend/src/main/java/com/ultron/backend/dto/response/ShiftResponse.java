package com.ultron.backend.dto.response;

import com.ultron.backend.domain.enums.ShiftType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftResponse {

    private String id;
    private String shiftId;

    // Shift Details
    private String name;
    private String description;
    private String code;

    // Timing
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer workHoursMinutes;

    // Flexibility
    private ShiftType type;
    private Integer graceMinutes;
    private Integer flexibleStartMinutes;
    private Integer flexibleEndMinutes;

    // Break Configuration
    private Integer mandatoryBreakMinutes;
    private Integer maxBreakMinutes;

    // Week Configuration
    private List<DayOfWeek> workingDays;
    private List<DayOfWeek> weekendDays;

    // Overtime Rules
    private Boolean allowOvertime;
    private Integer maxOvertimeMinutesPerDay;
    private Integer minOvertimeMinutes;

    // Status
    private Boolean isDefault;
    private Boolean isActive;

    // System Fields
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
}
