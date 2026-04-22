package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.OnboardingTaskAssignee;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
@Document(collection = "onboarding_instances")
public class OnboardingInstance {
    @Id private String id;
    @Indexed(unique = true) private String instanceId;
    @Indexed private String tenantId;
    private String templateId;
    @Indexed private String employeeId;
    private String mentorId;
    private LocalDate startDate;
    private List<InstanceTask> tasks;
    private int progress;
    private boolean isDeleted;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class InstanceTask {
        private String taskTitle;
        private String description;
        private OnboardingTaskAssignee assigneeTo;
        private Integer dueDaysFromStart;
        private boolean isRequired;
        private String status; // PENDING, DONE
        private LocalDateTime completedAt;
        private String completedBy;
    }
}
