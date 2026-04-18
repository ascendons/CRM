package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.EscalationLevel;
import com.ultron.backend.domain.enums.EscalationTrigger;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateEscalationRuleRequest {

    @NotBlank
    private String name;

    @NotNull
    private EscalationTrigger trigger;

    @NotNull
    private Integer conditionMinutes;

    @NotNull
    private EscalationLevel level;

    private List<String> notifyUserIds;
    private List<String> notificationChannels;
    private Integer autoEscalateAfterMinutes;
    private boolean active = true;
}
