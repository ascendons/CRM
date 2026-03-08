package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.GeofenceShape;
import com.ultron.backend.domain.enums.LocationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "office_locations")
@CompoundIndexes({
    @CompoundIndex(name = "locationId_tenantId_unique", def = "{'locationId': 1, 'tenantId': 1}", unique = true),
    @CompoundIndex(name = "tenantId_isActive", def = "{'tenantId': 1, 'isActive': 1}"),
    @CompoundIndex(name = "tenantId_isDeleted", def = "{'tenantId': 1, 'isDeleted': 1}")
})
public class OfficeLocation {

    @Id
    private String id;

    // Business ID (LOC-YYYY-MM-XXXXX)
    private String locationId;

    // Multi-tenancy
    @Indexed
    private String tenantId;

    // Location Details
    private String name; // "Bangalore HQ", "Mumbai Office", etc.
    private String code; // "BLR-HQ", "MUM-01"
    private String address;
    private String city;
    private String state;
    private String country;
    private String postalCode;

    // GPS Coordinates (center point)
    private Double latitude;
    private Double longitude;

    // Geofence Configuration
    @Builder.Default
    private Integer radiusMeters = 100; // Geofence radius (e.g., 100 meters)
    @Builder.Default
    private GeofenceShape shape = GeofenceShape.CIRCLE; // CIRCLE, POLYGON (future enhancement)
    @Builder.Default
    private Boolean enforceGeofence = true; // Strict or relaxed mode
    @Builder.Default
    private Boolean allowManualOverride = false; // Allow check-in outside geofence with approval

    // Location Settings
    private LocationType type; // HEAD_OFFICE, BRANCH, CLIENT_SITE, COWORKING
    @Builder.Default
    private Boolean isHeadquarters = false;
    @Builder.Default
    private Boolean isActive = true;

    // Remote Work Settings
    @Builder.Default
    private Boolean allowRemoteCheckIn = false; // Allow checking in from this location remotely

    // Contact Information
    private String contactPerson;
    private String contactPhone;
    private String contactEmail;

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
