package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Activity;
import com.ultron.backend.domain.entity.Lead;
import com.ultron.backend.domain.entity.Contact;
import com.ultron.backend.domain.entity.Account;
import com.ultron.backend.domain.entity.Opportunity;
import com.ultron.backend.domain.enums.ActivityType;
import com.ultron.backend.domain.enums.ActivityStatus;
import com.ultron.backend.domain.enums.ActivityPriority;
import com.ultron.backend.dto.request.CreateActivityRequest;
import com.ultron.backend.dto.request.UpdateActivityRequest;
import com.ultron.backend.dto.response.ActivityResponse;
import com.ultron.backend.dto.response.ActivityStatistics;
import com.ultron.backend.exception.ResourceNotFoundException;
import com.ultron.backend.repository.ActivityRepository;
import com.ultron.backend.repository.LeadRepository;
import com.ultron.backend.repository.ContactRepository;
import com.ultron.backend.repository.AccountRepository;
import com.ultron.backend.repository.OpportunityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final ActivityIdGeneratorService activityIdGeneratorService;
    private final LeadRepository leadRepository;
    private final ContactRepository contactRepository;
    private final AccountRepository accountRepository;
    private final OpportunityRepository opportunityRepository;
    private final UserService userService;

    @Transactional
    public ActivityResponse createActivity(CreateActivityRequest request, String currentUserId) {
        String currentUserName = userService.getUserFullName(currentUserId);

        Activity activity = Activity.builder()
                .activityId(activityIdGeneratorService.generateActivityId())
                .subject(request.getSubject())
                .type(request.getType())
                .status(request.getStatus())
                .priority(request.getPriority())
                .description(request.getDescription())
                .scheduledDate(request.getScheduledDate())
                .dueDate(request.getDueDate())
                .durationMinutes(request.getDurationMinutes())
                .location(request.getLocation())
                .assignedToId(request.getAssignedToId())
                .participants(request.getParticipants())
                .emailFrom(request.getEmailFrom())
                .emailTo(request.getEmailTo())
                .emailCc(request.getEmailCc())
                .emailBcc(request.getEmailBcc())
                .emailSubject(request.getEmailSubject())
                .phoneNumber(request.getPhoneNumber())
                .callDirection(request.getCallDirection())
                .callOutcome(request.getCallOutcome())
                .callDuration(request.getCallDuration())
                .meetingLink(request.getMeetingLink())
                .meetingType(request.getMeetingType())
                .attendees(request.getAttendees())
                .taskCategory(request.getTaskCategory())
                .isRecurring(request.getIsRecurring())
                .recurrencePattern(request.getRecurrencePattern())
                .tags(request.getTags())
                .outcome(request.getOutcome())
                .nextSteps(request.getNextSteps())
                .isPrivate(request.getIsPrivate())
                .reminderSet(request.getReminderSet())
                .reminderDate(request.getReminderDate())
                .createdAt(LocalDateTime.now())
                .createdBy(currentUserId)
                .createdByName(currentUserName)
                .lastModifiedAt(LocalDateTime.now())
                .lastModifiedBy(currentUserId)
                .lastModifiedByName(currentUserName)
                .isDeleted(false)
                .build();

        // Set related entity names
        if (request.getLeadId() != null) {
            Lead lead = leadRepository.findById(request.getLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));
            activity.setLeadId(lead.getId());
            activity.setLeadName(lead.getFirstName() + " " + lead.getLastName());
        }

        if (request.getContactId() != null) {
            Contact contact = contactRepository.findById(request.getContactId())
                    .orElseThrow(() -> new ResourceNotFoundException("Contact not found"));
            activity.setContactId(contact.getId());
            activity.setContactName(contact.getFirstName() + " " + contact.getLastName());
        }

        if (request.getAccountId() != null) {
            Account account = accountRepository.findById(request.getAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
            activity.setAccountId(account.getId());
            activity.setAccountName(account.getAccountName());
        }

        if (request.getOpportunityId() != null) {
            Opportunity opportunity = opportunityRepository.findById(request.getOpportunityId())
                    .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found"));
            activity.setOpportunityId(opportunity.getId());
            activity.setOpportunityName(opportunity.getOpportunityName());
        }

        // Set assigned to name
        if (request.getAssignedToId() != null) {
            String assignedUserName = userService.getUserFullName(request.getAssignedToId());
            activity.setAssignedToName(assignedUserName);
        }

        Activity savedActivity = activityRepository.save(activity);
        return mapToResponse(savedActivity);
    }

    public List<ActivityResponse> getAllActivities() {
        return activityRepository.findByIsDeletedFalse().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ActivityResponse getActivityById(String id) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found"));

        if (activity.getIsDeleted()) {
            throw new ResourceNotFoundException("Activity not found");
        }

        return mapToResponse(activity);
    }

    public ActivityResponse getActivityByActivityId(String activityId) {
        Activity activity = activityRepository.findByActivityId(activityId)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found"));

        if (activity.getIsDeleted()) {
            throw new ResourceNotFoundException("Activity not found");
        }

        return mapToResponse(activity);
    }

    public List<ActivityResponse> getActivitiesByType(ActivityType type) {
        return activityRepository.findByTypeAndIsDeletedFalse(type).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ActivityResponse> getActivitiesByStatus(ActivityStatus status) {
        return activityRepository.findByStatusAndIsDeletedFalse(status).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ActivityResponse> getActivitiesByPriority(ActivityPriority priority) {
        return activityRepository.findByPriorityAndIsDeletedFalse(priority).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ActivityResponse> getActivitiesByLead(String leadId) {
        return activityRepository.findByLeadIdAndIsDeletedFalse(leadId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ActivityResponse> getActivitiesByContact(String contactId) {
        return activityRepository.findByContactIdAndIsDeletedFalse(contactId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ActivityResponse> getActivitiesByAccount(String accountId) {
        return activityRepository.findByAccountIdAndIsDeletedFalse(accountId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ActivityResponse> getActivitiesByOpportunity(String opportunityId) {
        return activityRepository.findByOpportunityIdAndIsDeletedFalse(opportunityId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ActivityResponse> getActivitiesByUser(String userId) {
        return activityRepository.findByAssignedToIdAndIsDeletedFalse(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ActivityResponse> getActiveActivities() {
        return activityRepository.findActiveActivities().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ActivityResponse> getOverdueActivities() {
        return activityRepository.findOverdueActivities(LocalDateTime.now()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ActivityResponse> searchActivities(String query) {
        return activityRepository.searchActivities(query).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ActivityResponse updateActivity(String id, UpdateActivityRequest request, String currentUserId) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found"));

        if (activity.getIsDeleted()) {
            throw new ResourceNotFoundException("Activity not found");
        }

        String currentUserName = userService.getUserFullName(currentUserId);

        // Update fields if provided
        if (request.getSubject() != null) activity.setSubject(request.getSubject());
        if (request.getType() != null) activity.setType(request.getType());
        if (request.getStatus() != null) {
            activity.setStatus(request.getStatus());
            if (request.getStatus() == ActivityStatus.COMPLETED && activity.getCompletedDate() == null) {
                activity.setCompletedDate(LocalDateTime.now());
            }
        }
        if (request.getPriority() != null) activity.setPriority(request.getPriority());
        if (request.getDescription() != null) activity.setDescription(request.getDescription());
        if (request.getScheduledDate() != null) activity.setScheduledDate(request.getScheduledDate());
        if (request.getDueDate() != null) activity.setDueDate(request.getDueDate());
        if (request.getCompletedDate() != null) activity.setCompletedDate(request.getCompletedDate());
        if (request.getDurationMinutes() != null) activity.setDurationMinutes(request.getDurationMinutes());
        if (request.getLocation() != null) activity.setLocation(request.getLocation());
        if (request.getParticipants() != null) activity.setParticipants(request.getParticipants());
        if (request.getEmailFrom() != null) activity.setEmailFrom(request.getEmailFrom());
        if (request.getEmailTo() != null) activity.setEmailTo(request.getEmailTo());
        if (request.getEmailCc() != null) activity.setEmailCc(request.getEmailCc());
        if (request.getEmailBcc() != null) activity.setEmailBcc(request.getEmailBcc());
        if (request.getEmailSubject() != null) activity.setEmailSubject(request.getEmailSubject());
        if (request.getPhoneNumber() != null) activity.setPhoneNumber(request.getPhoneNumber());
        if (request.getCallDirection() != null) activity.setCallDirection(request.getCallDirection());
        if (request.getCallOutcome() != null) activity.setCallOutcome(request.getCallOutcome());
        if (request.getCallDuration() != null) activity.setCallDuration(request.getCallDuration());
        if (request.getMeetingLink() != null) activity.setMeetingLink(request.getMeetingLink());
        if (request.getMeetingType() != null) activity.setMeetingType(request.getMeetingType());
        if (request.getAttendees() != null) activity.setAttendees(request.getAttendees());
        if (request.getTaskCategory() != null) activity.setTaskCategory(request.getTaskCategory());
        if (request.getIsRecurring() != null) activity.setIsRecurring(request.getIsRecurring());
        if (request.getRecurrencePattern() != null) activity.setRecurrencePattern(request.getRecurrencePattern());
        if (request.getTags() != null) activity.setTags(request.getTags());
        if (request.getOutcome() != null) activity.setOutcome(request.getOutcome());
        if (request.getNextSteps() != null) activity.setNextSteps(request.getNextSteps());
        if (request.getIsPrivate() != null) activity.setIsPrivate(request.getIsPrivate());
        if (request.getReminderSet() != null) activity.setReminderSet(request.getReminderSet());
        if (request.getReminderDate() != null) activity.setReminderDate(request.getReminderDate());

        // Update related entities if changed
        if (request.getLeadId() != null && !request.getLeadId().equals(activity.getLeadId())) {
            Lead lead = leadRepository.findById(request.getLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));
            activity.setLeadId(lead.getId());
            activity.setLeadName(lead.getFirstName() + " " + lead.getLastName());
        }

        if (request.getContactId() != null && !request.getContactId().equals(activity.getContactId())) {
            Contact contact = contactRepository.findById(request.getContactId())
                    .orElseThrow(() -> new ResourceNotFoundException("Contact not found"));
            activity.setContactId(contact.getId());
            activity.setContactName(contact.getFirstName() + " " + contact.getLastName());
        }

        if (request.getAccountId() != null && !request.getAccountId().equals(activity.getAccountId())) {
            Account account = accountRepository.findById(request.getAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
            activity.setAccountId(account.getId());
            activity.setAccountName(account.getAccountName());
        }

        if (request.getOpportunityId() != null && !request.getOpportunityId().equals(activity.getOpportunityId())) {
            Opportunity opportunity = opportunityRepository.findById(request.getOpportunityId())
                    .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found"));
            activity.setOpportunityId(opportunity.getId());
            activity.setOpportunityName(opportunity.getOpportunityName());
        }

        if (request.getAssignedToId() != null && !request.getAssignedToId().equals(activity.getAssignedToId())) {
            String assignedUserName = userService.getUserFullName(request.getAssignedToId());
            activity.setAssignedToId(request.getAssignedToId());
            activity.setAssignedToName(assignedUserName);
        }

        activity.setLastModifiedAt(LocalDateTime.now());
        activity.setLastModifiedBy(currentUserId);
        activity.setLastModifiedByName(currentUserName);

        Activity updatedActivity = activityRepository.save(activity);
        return mapToResponse(updatedActivity);
    }

    @Transactional
    public void deleteActivity(String id, String currentUserId) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found"));

        if (activity.getIsDeleted()) {
            throw new ResourceNotFoundException("Activity not found");
        }

        activity.setIsDeleted(true);
        activity.setDeletedBy(currentUserId);
        activity.setDeletedAt(LocalDateTime.now());

        activityRepository.save(activity);
    }

    public long getActivityCount() {
        return activityRepository.countByIsDeletedFalse();
    }

    public ActivityStatistics getStatistics() {
        List<Activity> allActivities = activityRepository.findByIsDeletedFalse();
        List<Activity> activeActivities = activityRepository.findActiveActivities();
        List<Activity> completedActivities = activityRepository.findCompletedActivities();
        List<Activity> overdueActivities = activityRepository.findOverdueActivities(LocalDateTime.now());

        long cancelledCount = allActivities.stream()
                .filter(a -> a.getStatus() == ActivityStatus.CANCELLED)
                .count();

        long taskCount = activityRepository.countByTypeAndIsDeletedFalse(ActivityType.TASK);
        long emailCount = activityRepository.countByTypeAndIsDeletedFalse(ActivityType.EMAIL);
        long callCount = activityRepository.countByTypeAndIsDeletedFalse(ActivityType.CALL);
        long meetingCount = activityRepository.countByTypeAndIsDeletedFalse(ActivityType.MEETING);
        long noteCount = activityRepository.countByTypeAndIsDeletedFalse(ActivityType.NOTE);

        long pendingCount = activityRepository.countByStatusAndIsDeletedFalse(ActivityStatus.PENDING);
        long inProgressCount = activityRepository.countByStatusAndIsDeletedFalse(ActivityStatus.IN_PROGRESS);
        long completedCount = activityRepository.countByStatusAndIsDeletedFalse(ActivityStatus.COMPLETED);

        long urgentCount = allActivities.stream()
                .filter(a -> a.getPriority() == ActivityPriority.URGENT)
                .count();
        long highCount = allActivities.stream()
                .filter(a -> a.getPriority() == ActivityPriority.HIGH)
                .count();
        long mediumCount = allActivities.stream()
                .filter(a -> a.getPriority() == ActivityPriority.MEDIUM)
                .count();
        long lowCount = allActivities.stream()
                .filter(a -> a.getPriority() == ActivityPriority.LOW)
                .count();

        double averageDuration = allActivities.stream()
                .filter(a -> a.getDurationMinutes() != null)
                .mapToInt(Activity::getDurationMinutes)
                .average()
                .orElse(0.0);

        long totalCallDuration = allActivities.stream()
                .filter(a -> a.getType() == ActivityType.CALL && a.getCallDuration() != null)
                .mapToInt(Activity::getCallDuration)
                .sum();

        long totalMeetingDuration = allActivities.stream()
                .filter(a -> a.getType() == ActivityType.MEETING && a.getDurationMinutes() != null)
                .mapToInt(Activity::getDurationMinutes)
                .sum();

        return ActivityStatistics.builder()
                .totalActivities(allActivities.size())
                .activeActivities(activeActivities.size())
                .completedActivities(completedActivities.size())
                .cancelledActivities(cancelledCount)
                .overdueActivities(overdueActivities.size())
                .taskCount(taskCount)
                .emailCount(emailCount)
                .callCount(callCount)
                .meetingCount(meetingCount)
                .noteCount(noteCount)
                .pendingCount(pendingCount)
                .inProgressCount(inProgressCount)
                .completedCount(completedCount)
                .urgentCount(urgentCount)
                .highCount(highCount)
                .mediumCount(mediumCount)
                .lowCount(lowCount)
                .averageDurationMinutes(averageDuration)
                .totalCallDuration(totalCallDuration)
                .totalMeetingDuration(totalMeetingDuration)
                .build();
    }

    private ActivityResponse mapToResponse(Activity activity) {
        return ActivityResponse.builder()
                .id(activity.getId())
                .activityId(activity.getActivityId())
                .subject(activity.getSubject())
                .type(activity.getType())
                .status(activity.getStatus())
                .priority(activity.getPriority())
                .description(activity.getDescription())
                .scheduledDate(activity.getScheduledDate())
                .dueDate(activity.getDueDate())
                .completedDate(activity.getCompletedDate())
                .durationMinutes(activity.getDurationMinutes())
                .location(activity.getLocation())
                .leadId(activity.getLeadId())
                .leadName(activity.getLeadName())
                .contactId(activity.getContactId())
                .contactName(activity.getContactName())
                .accountId(activity.getAccountId())
                .accountName(activity.getAccountName())
                .opportunityId(activity.getOpportunityId())
                .opportunityName(activity.getOpportunityName())
                .assignedToId(activity.getAssignedToId())
                .assignedToName(activity.getAssignedToName())
                .participants(activity.getParticipants())
                .emailFrom(activity.getEmailFrom())
                .emailTo(activity.getEmailTo())
                .emailCc(activity.getEmailCc())
                .emailBcc(activity.getEmailBcc())
                .emailSubject(activity.getEmailSubject())
                .phoneNumber(activity.getPhoneNumber())
                .callDirection(activity.getCallDirection())
                .callOutcome(activity.getCallOutcome())
                .callDuration(activity.getCallDuration())
                .meetingLink(activity.getMeetingLink())
                .meetingType(activity.getMeetingType())
                .attendees(activity.getAttendees())
                .taskCategory(activity.getTaskCategory())
                .isRecurring(activity.getIsRecurring())
                .recurrencePattern(activity.getRecurrencePattern())
                .tags(activity.getTags())
                .outcome(activity.getOutcome())
                .nextSteps(activity.getNextSteps())
                .isPrivate(activity.getIsPrivate())
                .reminderSet(activity.getReminderSet())
                .reminderDate(activity.getReminderDate())
                .createdAt(activity.getCreatedAt())
                .createdBy(activity.getCreatedBy())
                .createdByName(activity.getCreatedByName())
                .lastModifiedAt(activity.getLastModifiedAt())
                .lastModifiedBy(activity.getLastModifiedBy())
                .lastModifiedByName(activity.getLastModifiedByName())
                .build();
    }
}
