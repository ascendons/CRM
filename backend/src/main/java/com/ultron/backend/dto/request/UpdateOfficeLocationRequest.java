package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.GeofenceShape;
import com.ultron.backend.domain.enums.LocationType;
import jakarta.validation.constraints.*;
import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOfficeLocationRequest {

    @Size(min = 2, max = 100, message = "Location name must be between 2 and 100 characters")
    private String name;

    @Size(min = 2, max = 20, message = "Location code must be between 2 and 20 characters")
    private String code;

    private String address;
    private String city;
    private String state;
    private String country;
    private String postalCode;

    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90")
    @DecimalMax(value = "90.0",  message = "Latitude must be <= 90")
    private Double latitude;

    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180")
    @DecimalMax(value = "180.0",  message = "Longitude must be <= 180")
    private Double longitude;

    @Positive(message = "Radius must be a positive number")
    private Integer radiusMeters;
    private GeofenceShape shape;
    private Boolean enforceGeofence;
    private Boolean allowManualOverride;

    private LocationType type;

    private Boolean isHeadquarters;
    private Boolean isActive;
    private Boolean allowRemoteCheckIn;

    private String contactPerson;
    private String contactPhone;

    @Email(message = "Please provide a valid email address")
    private String contactEmail;
}
