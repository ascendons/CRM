package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.ShiftType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class CreateShiftRequest {

    @NotBlank(message = "Shift name is required")
    @Size(min = 2, max = 100, message = "Shift name must be between 2 and 100 characters")
    private String name;

    private String description;

    @NotBlank(message = "Shift code is required")
    @Size(min = 2, max = 20, message = "Shift code must be between 2 and 20 characters")
    private String code;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    @NotNull(message = "Work hours (in minutes) is required")
    private Integer workHoursMinutes;

    @NotNull(message = "Shift type is required")
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
