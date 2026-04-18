package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.EscalationLevel;
import com.ultron.backend.domain.enums.EscalationTrigger;
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
@Document(collection = "escalation_rules")
public class EscalationRule {

    @Id
    private String id;

    @Indexed
    private String tenantId;

    private String name;
    private EscalationTrigger trigger;
    private Integer conditionMinutes;
    private EscalationLevel level;
    private List<String> notifyUserIds;
    private List<String> notificationChannels;  // InApp / Email / SMS
    private Integer autoEscalateAfterMinutes;
    private boolean active;

    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
