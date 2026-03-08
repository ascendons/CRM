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
public class CreateOfficeLocationRequest {

    @NotBlank(message = "Location name is required")
    @Size(min = 2, max = 100, message = "Location name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "Location code is required")
    @Size(min = 2, max = 20, message = "Location code must be between 2 and 20 characters")
    private String code;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "State is required")
    private String state;

    @NotBlank(message = "Country is required")
    private String country;

    private String postalCode;

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90")
    @DecimalMax(value = "90.0",  message = "Latitude must be <= 90")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180")
    @DecimalMax(value = "180.0",  message = "Longitude must be <= 180")
    private Double longitude;

    @Positive(message = "Radius must be a positive number")
    private Integer radiusMeters;
    private GeofenceShape shape;
    private Boolean enforceGeofence;
    private Boolean allowManualOverride;

    @NotNull(message = "Location type is required")
    private LocationType type;

    private Boolean isHeadquarters;
    private Boolean isActive;
    private Boolean allowRemoteCheckIn;

    private String contactPerson;
    private String contactPhone;

    @Email(message = "Please provide a valid email address")
    private String contactEmail;
}
