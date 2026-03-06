package com.ultron.backend.dto.holiday;

import com.ultron.backend.domain.enums.HolidayType;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Request DTO for creating a holiday
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateHolidayRequest {

    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotBlank(message = "Name is required")
    @Size(min = 3, max = 100, message = "Name must be between 3 and 100 characters")
    private String name;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @NotNull(message = "Holiday type is required")
    private HolidayType type;

    private List<String> applicableLocations; // Office location IDs
    private List<String> applicableStates; // State codes

    private Boolean isOptional;
    private Integer maxOptionalAllowed;
}
