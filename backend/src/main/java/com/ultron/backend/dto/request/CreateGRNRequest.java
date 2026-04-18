package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.GRNQualityStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class CreateGRNRequest {

    @NotBlank
    private String poId;

    private LocalDate receivedDate;

    @NotEmpty
    private List<LineItemDto> lineItems;

    private GRNQualityStatus qualityStatus;
    private String remarks;

    @Data
    public static class LineItemDto {
        private String partId;
        private Integer orderedQty;
        private Integer receivedQty;
        private String condition;
    }
}
