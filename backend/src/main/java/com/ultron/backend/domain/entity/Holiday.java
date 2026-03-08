package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.HolidayType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a holiday
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "holidays")
@CompoundIndexes({
        @CompoundIndex(name = "tenantId_date_unique", def = "{'tenantId': 1, 'date': 1}", unique = true),
        @CompoundIndex(name = "tenantId_year", def = "{'tenantId': 1, 'year': 1}")
})
public class Holiday {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    @Indexed
    private LocalDate date;

    @Indexed
    private Integer year;

    private String name;
    private String description;

    private HolidayType type;

    @Builder.Default
    private List<String> applicableLocations = new ArrayList<>(); // Office location IDs

    @Builder.Default
    private List<String> applicableStates = new ArrayList<>();

    private Boolean isOptional;
    private Integer maxOptionalAllowed;

    // Audit fields
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;

    @Indexed
    private Boolean isDeleted;
    private LocalDateTime deletedAt;
    private String deletedBy;
}
