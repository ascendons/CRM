package com.ultron.backend.dto.request;

import com.ultron.backend.domain.enums.ActivityType;
import com.ultron.backend.domain.enums.ActivityStatus;
import com.ultron.backend.domain.enums.ActivityPriority;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateActivityRequest {

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
    private String contactId;
    private String accountId;
    private String opportunityId;

    // Assignment
    private String assignedToId;
    private List<String> participants;

    // Email Specific
    private String emailFrom;
    private String emailTo;
    private List<String> emailCc;
    private List<String> emailBcc;
    private String emailSubject;

    // Call Specific
    private String phoneNumber;
    private String callDirection;
    private String callOutcome;
    private Integer callDuration;

    // Meeting Specific
    private String meetingLink;
    private String meetingType;
    private List<String> attendees;

    // Task Specific
    private String taskCategory;
    private Boolean isRecurring;
    private String recurrencePattern;

    // Additional
    private List<String> tags;
    private String outcome;
    private String nextSteps;
    private Boolean isPrivate;
    private Boolean reminderSet;
    private LocalDateTime reminderDate;
}
