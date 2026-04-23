package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.EscalationLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "escalation_logs")
public class EscalationLog {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    private String ruleId;
    private String entityType;          // WorkOrder / ServiceRequest / PurchaseOrder
    private String entityId;
    private LocalDateTime triggeredAt;
    private EscalationLevel level;
    private List<String> notifiedUserIds;
    private LocalDateTime acknowledgedAt;
    private String acknowledgedBy;
    private LocalDateTime resolvedAt;
}
