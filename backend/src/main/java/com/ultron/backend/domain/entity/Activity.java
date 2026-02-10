package com.ultron.backend.domain.entity;

import com.ultron.backend.domain.enums.ActivityType;
import com.ultron.backend.domain.enums.ActivityStatus;
import com.ultron.backend.domain.enums.ActivityPriority;
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

@Document(collection = "activities")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Activity {
    @Id
    private String id;

    @Indexed(unique = true)
    private String activityId; // ACT-YYYY-MM-XXXXX

    // Multi-tenancy
    @Indexed
    private String tenantId;

    // Basic Information
    private String subject;
    private ActivityType type;
    private ActivityStatus status;
    private ActivityPriority priority;
    private String description;

    // Scheduling
    private LocalDateTime scheduledDate;
    private LocalDateTime dueDate;
    private LocalDateTime completedDate;
    private Integer durationMinutes;
    private String location;

    // Related Entities
    private String leadId;
    private String leadName;
    private String contactId;
    private String contactName;
    private String accountId;
    private String accountName;
    private String opportunityId;
    private String opportunityName;

    // Assignment
    private String assignedToId;
    private String assignedToName;
    private List<String> participants;

    // Email Specific
    private String emailFrom;
    private String emailTo;
    private List<String> emailCc;
    private List<String> emailBcc;
    private String emailSubject;

    // Call Specific
    private String phoneNumber;
    private String callDirection; // INBOUND, OUTBOUND
    private String callOutcome;
    private Integer callDuration;

    // Meeting Specific
    private String meetingLink;
    private String meetingType; // IN_PERSON, VIRTUAL, PHONE
    private List<String> attendees;

    // Task Specific
    private String taskCategory;
    private Boolean isRecurring;
    private String recurrencePattern;

    // Additional Information
    private List<String> tags;
    private String outcome;
    private String nextSteps;
    private Boolean isPrivate;
    private Boolean reminderSet;
    private LocalDateTime reminderDate;

    // System Fields
    private LocalDateTime createdAt;
    private String createdBy;
    private String createdByName;
    private LocalDateTime lastModifiedAt;
    private String lastModifiedBy;
    private String lastModifiedByName;
    private Boolean isDeleted;
    private String deletedBy;
    private LocalDateTime deletedAt;
}
