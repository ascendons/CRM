package com.ultron.backend.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMyProfileRequest {
    
    @Size(min = 2, max = 50)
    private String firstName;
    
    @Size(min = 2, max = 50)
    private String lastName;
    
    private String title;
    
    private String department;
    
    private String phone;
    
    private String mobilePhone;
    
    private String avatar;
}
