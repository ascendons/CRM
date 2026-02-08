package com.ultron.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSettingsRequest {
    
    private String timeZone;
    private String language;
    private String dateFormat;
    private String currency;
    
    private Boolean emailNotifications;
    private Boolean desktopNotifications;
}
