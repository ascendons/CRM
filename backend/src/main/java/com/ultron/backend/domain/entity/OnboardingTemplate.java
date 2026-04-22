package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.OnboardingTaskAssignee;
import com.ultron.backend.domain.enums.OnboardingType;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
@Document(collection = "onboarding_templates")
public class OnboardingTemplate {
    @Id private String id;
    @Indexed(unique = true) private String templateId;
    @Indexed private String tenantId;
    private String name;
    private OnboardingType type;
    private List<TemplateTask> tasks;
    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TemplateTask {
        private String taskTitle;
        private String description;
        private OnboardingTaskAssignee assigneeTo;
        private Integer dueDaysFromStart;
        private boolean isRequired;
    }
}
