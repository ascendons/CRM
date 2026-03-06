package com.ultron.backend.dto.response;

import com.ultron.backend.domain.enums.GeofenceShape;
import com.ultron.backend.domain.enums.LocationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfficeLocationResponse {

    private String id;
    private String locationId;

    // Location Details
    private String name;
    private String code;
    private String address;
    private String city;
    private String state;
    private String country;
    private String postalCode;

    // GPS Coordinates
    private Double latitude;
    private Double longitude;

    // Geofence Configuration
    private Integer radiusMeters;
    private GeofenceShape shape;
    private Boolean enforceGeofence;
    private Boolean allowManualOverride;

    // Location Settings
    private LocationType type;
    private Boolean isHeadquarters;
    private Boolean isActive;
    private Boolean allowRemoteCheckIn;

    // Contact Information
    private String contactPerson;
    private String contactPhone;
    private String contactEmail;

    // System Fields
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
}
