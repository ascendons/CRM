package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.GRNQualityStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "grns")
public class GRN {

    @Id
    private String id;

    @Indexed(unique = true)
    private String grnNumber;           // GRN-timestamp

    @Indexed
    private String tenantId;

    private String poId;
    private LocalDate receivedDate;
    private String receivedBy;
    private List<GRNLineItem> lineItems;
    private GRNQualityStatus qualityStatus;
    private String remarks;

    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GRNLineItem {
        private String partId;
        private Integer orderedQty;
        private Integer receivedQty;
        private String condition;       // Good / Damaged / Rejected
    }
}
