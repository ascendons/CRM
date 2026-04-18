package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.ServiceRequestSource;
import com.ultron.backend.domain.enums.WorkOrderPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateServiceRequestRequest {

    @NotBlank(message = "Account ID is required")
    private String accountId;

    private String contactId;
    private String assetId;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Priority is required")
    private WorkOrderPriority priority;

    @NotNull(message = "Source is required")
    private ServiceRequestSource source;
}
