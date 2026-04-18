package com.ultron.backend.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class CreateRFQRequest {

    @NotEmpty
    private List<RFQItemDto> items;

    @NotEmpty
    private List<String> vendorIds;

    private String description;
    private LocalDate deadline;

    @Data
    public static class RFQItemDto {
        private String partId;
        private Integer qty;
        private String specs;
    }
}
