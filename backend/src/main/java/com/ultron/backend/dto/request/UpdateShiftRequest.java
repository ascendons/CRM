package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.ShiftType;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateShiftRequest {

    @Size(min = 2, max = 100, message = "Shift name must be between 2 and 100 characters")
    private String name;

    private String description;

    @Size(min = 2, max = 20, message = "Shift code must be between 2 and 20 characters")
    private String code;

    private LocalTime startTime;
    private LocalTime endTime;
    private Integer workHoursMinutes;

    private ShiftType type;

    private Integer graceMinutes;
    private Integer flexibleStartMinutes;
    private Integer flexibleEndMinutes;

    private Integer mandatoryBreakMinutes;
    private Integer maxBreakMinutes;

    private List<DayOfWeek> workingDays;
    private List<DayOfWeek> weekendDays;

    private Boolean allowOvertime;
    private Integer maxOvertimeMinutesPerDay;
    private Integer minOvertimeMinutes;

    private Boolean isDefault;
    private Boolean isActive;
}
