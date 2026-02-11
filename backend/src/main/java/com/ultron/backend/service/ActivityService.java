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
public class ActivityService extends BaseTenantService {

    private final ActivityRepository activityRepository;
    private final ActivityIdGeneratorService activityIdGeneratorService;
    private final LeadRepository leadRepository;
    private final ContactRepository contactRepository;
    private final AccountRepository accountRepository;
    private final OpportunityRepository opportunityRepository;
    private final UserService userService;

    @Transactional
    public ActivityResponse createActivity(CreateActivityRequest request, String currentUserId) {
        // Get current tenant ID for multi-tenancy
        String tenantId = getCurrentTenantId();

        log.info("[Tenant: {}] Creating activity with subject: {}", tenantId, request.getSubject());

        String currentUserName = userService.getUserFullName(currentUserId);

        Activity activity = Activity.builder()
                .activityId(activityIdGeneratorService.generateActivityId())
                .tenantId(tenantId)  // CRITICAL: Set tenant ID for data isolation
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

        // Set related entity names (with tenant validation)
        if (request.getLeadId() != null) {
            Lead lead = leadRepository.findById(request.getLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));
            validateResourceTenantOwnership(lead.getTenantId());
            activity.setLeadId(lead.getId());
            activity.setLeadName(lead.getFirstName() + " " + lead.getLastName());
        }

        if (request.getContactId() != null) {
            Contact contact = contactRepository.findById(request.getContactId())
                    .orElseThrow(() -> new ResourceNotFoundException("Contact not found"));
            validateResourceTenantOwnership(contact.getTenantId());
            activity.setContactId(contact.getId());
            activity.setContactName(contact.getFirstName() + " " + contact.getLastName());
        }

        if (request.getAccountId() != null) {
            Account account = accountRepository.findById(request.getAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
            validateResourceTenantOwnership(account.getTenantId());
            activity.setAccountId(account.getId());
            activity.setAccountName(account.getAccountName());
        }

        if (request.getOpportunityId() != null) {
            Opportunity opportunity = opportunityRepository.findById(request.getOpportunityId())
                    .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found"));
            validateResourceTenantOwnership(opportunity.getTenantId());
            activity.setOpportunityId(opportunity.getId());
            activity.setOpportunityName(opportunity.getOpportunityName());
        }

        // Set assigned to name
        if (request.getAssignedToId() != null) {
            String assignedUserName = userService.getUserFullName(request.getAssignedToId());
            activity.setAssignedToName(assignedUserName);
        }

        Activity savedActivity = activityRepository.save(activity);
        log.info("Activity created successfully with ID: {}", savedActivity.getActivityId());
        return mapToResponse(savedActivity);
    }

    public List<ActivityResponse> getAllActivities() {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching all activities", tenantId);
        return activityRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ActivityResponse getActivityById(String id) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found"));

        // Validate tenant ownership
        validateResourceTenantOwnership(activity.getTenantId());

        if (activity.getIsDeleted()) {
            throw new ResourceNotFoundException("Activity not found");
        }

        return mapToResponse(activity);
    }

    public ActivityResponse getActivityByActivityId(String activityId) {
        String tenantId = getCurrentTenantId();
        Activity activity = activityRepository.findByActivityIdAndTenantId(activityId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found"));

        if (activity.getIsDeleted()) {
            throw new ResourceNotFoundException("Activity not found");
        }

        return mapToResponse(activity);
    }

    public List<ActivityResponse> getActivitiesByType(ActivityType type) {
        String tenantId = getCurrentTenantId();
        return activityRepository.findByTypeAndTenantIdAndIsDeletedFalse(type, tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ActivityResponse> getActivitiesByStatus(ActivityStatus status) {
        String tenantId = getCurrentTenantId();
        return activityRepository.findByStatusAndTenantIdAndIsDeletedFalse(status, tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ActivityResponse> getActivitiesByPriority(ActivityPriority priority) {
        String tenantId = getCurrentTenantId();
        return activityRepository.findByPriorityAndTenantIdAndIsDeletedFalse(priority, tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ActivityResponse> getActivitiesByLead(String leadId) {
        String tenantId = getCurrentTenantId();
        return activityRepository.findByLeadIdAndTenantIdAndIsDeletedFalse(leadId, tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ActivityResponse> getActivitiesByContact(String contactId) {
        String tenantId = getCurrentTenantId();
        return activityRepository.findByContactIdAndTenantIdAndIsDeletedFalse(contactId, tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ActivityResponse> getActivitiesByAccount(String accountId) {
        String tenantId = getCurrentTenantId();
        return activityRepository.findByAccountIdAndTenantIdAndIsDeletedFalse(accountId, tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ActivityResponse> getActivitiesByOpportunity(String opportunityId) {
        String tenantId = getCurrentTenantId();
        return activityRepository.findByOpportunityIdAndTenantIdAndIsDeletedFalse(opportunityId, tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ActivityResponse> getActivitiesByUser(String userId) {
        String tenantId = getCurrentTenantId();
        return activityRepository.findByAssignedToIdAndTenantIdAndIsDeletedFalse(userId, tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ActivityResponse> getActiveActivities() {
        String tenantId = getCurrentTenantId();
        return activityRepository.findActiveActivitiesByTenantId(tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ActivityResponse> getOverdueActivities() {
        String tenantId = getCurrentTenantId();
        return activityRepository.findOverdueActivitiesByTenantId(LocalDateTime.now(), tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ActivityResponse> searchActivities(String query) {
        String tenantId = getCurrentTenantId();
        return activityRepository.searchActivitiesByTenantId(query, tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ActivityResponse updateActivity(String id, UpdateActivityRequest request, String currentUserId) {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Updating activity with id: {}", tenantId, id);

        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found"));

        // Validate tenant ownership
        validateResourceTenantOwnership(activity.getTenantId());

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

        // Update related entities if changed (with tenant validation)
        if (request.getLeadId() != null && !request.getLeadId().equals(activity.getLeadId())) {
            Lead lead = leadRepository.findById(request.getLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lead not found"));
            validateResourceTenantOwnership(lead.getTenantId());
            activity.setLeadId(lead.getId());
            activity.setLeadName(lead.getFirstName() + " " + lead.getLastName());
        }

        if (request.getContactId() != null && !request.getContactId().equals(activity.getContactId())) {
            Contact contact = contactRepository.findById(request.getContactId())
                    .orElseThrow(() -> new ResourceNotFoundException("Contact not found"));
            validateResourceTenantOwnership(contact.getTenantId());
            activity.setContactId(contact.getId());
            activity.setContactName(contact.getFirstName() + " " + contact.getLastName());
        }

        if (request.getAccountId() != null && !request.getAccountId().equals(activity.getAccountId())) {
            Account account = accountRepository.findById(request.getAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
            validateResourceTenantOwnership(account.getTenantId());
            activity.setAccountId(account.getId());
            activity.setAccountName(account.getAccountName());
        }

        if (request.getOpportunityId() != null && !request.getOpportunityId().equals(activity.getOpportunityId())) {
            Opportunity opportunity = opportunityRepository.findById(request.getOpportunityId())
                    .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found"));
            validateResourceTenantOwnership(opportunity.getTenantId());
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
        log.info("Activity {} updated successfully", id);
        return mapToResponse(updatedActivity);
    }

    @Transactional
    public void deleteActivity(String id, String currentUserId) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found"));

        // Validate tenant ownership
        validateResourceTenantOwnership(activity.getTenantId());

        if (activity.getIsDeleted()) {
            throw new ResourceNotFoundException("Activity not found");
        }

        activity.setIsDeleted(true);
        activity.setDeletedBy(currentUserId);
        activity.setDeletedAt(LocalDateTime.now());

        activityRepository.save(activity);
        log.info("Activity {} soft deleted by user {}", id, currentUserId);
    }

    public long getActivityCount() {
        String tenantId = getCurrentTenantId();
        return activityRepository.countByTenantIdAndIsDeletedFalse(tenantId);
    }

    public ActivityStatistics getStatistics() {
        String tenantId = getCurrentTenantId();
        log.debug("[Tenant: {}] Fetching activity statistics", tenantId);

        List<Activity> allActivities = activityRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        List<Activity> activeActivities = activityRepository.findActiveActivitiesByTenantId(tenantId);
        List<Activity> completedActivities = activityRepository.findCompletedActivitiesByTenantId(tenantId);
        List<Activity> overdueActivities = activityRepository.findOverdueActivitiesByTenantId(LocalDateTime.now(), tenantId);

        long cancelledCount = allActivities.stream()
                .filter(a -> a.getStatus() == ActivityStatus.CANCELLED)
                .count();

        long taskCount = activityRepository.countByTypeAndTenantIdAndIsDeletedFalse(ActivityType.TASK, tenantId);
        long emailCount = activityRepository.countByTypeAndTenantIdAndIsDeletedFalse(ActivityType.EMAIL, tenantId);
        long callCount = activityRepository.countByTypeAndTenantIdAndIsDeletedFalse(ActivityType.CALL, tenantId);
        long meetingCount = activityRepository.countByTypeAndTenantIdAndIsDeletedFalse(ActivityType.MEETING, tenantId);
        long noteCount = activityRepository.countByTypeAndTenantIdAndIsDeletedFalse(ActivityType.NOTE, tenantId);

        long pendingCount = activityRepository.countByStatusAndTenantIdAndIsDeletedFalse(ActivityStatus.PENDING, tenantId);
        long inProgressCount = activityRepository.countByStatusAndTenantIdAndIsDeletedFalse(ActivityStatus.IN_PROGRESS, tenantId);
        long completedCount = activityRepository.countByStatusAndTenantIdAndIsDeletedFalse(ActivityStatus.COMPLETED, tenantId);

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
