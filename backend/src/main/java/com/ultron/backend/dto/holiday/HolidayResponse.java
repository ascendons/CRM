package com.ultron.backend.dto.holiday;

import com.ultron.backend.domain.enums.HolidayType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for holiday details
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HolidayResponse {

    private String id;
    private String tenantId;
    private LocalDate date;
    private Integer year;
    private String name;
    private String description;
    private HolidayType type;
    private List<String> applicableLocations;
    private List<String> applicableStates;
    private Boolean isOptional;
    private Integer maxOptionalAllowed;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
}
