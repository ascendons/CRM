package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.GeofenceShape;
import com.ultron.backend.domain.enums.LocationType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
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

    private Double latitude;
    private Double longitude;

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
