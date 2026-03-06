package com.ultron.backend.dto.response;

import com.ultron.backend.domain.enums.BreakType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BreakRecordDTO {
    private String breakId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private BreakType type;
    private AttendanceLocationDTO startLocation;
    private AttendanceLocationDTO endLocation;
}
