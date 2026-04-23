package com.ultron.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class CreatePartsRequestRequest {

    @NotBlank
    private String workOrderId;

    @NotBlank
    private String engineerId;

    @NotEmpty
    private List<PartItem> requestedParts;

    private String warehouseId;

    @Data
    public static class PartItem {
        private String partId;
        private Integer qty;
        private String reason;
    }
}
