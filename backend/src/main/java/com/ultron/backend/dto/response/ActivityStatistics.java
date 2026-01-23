package com.ultron.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityStatistics {

    // Total counts
    private long totalActivities;
    private long activeActivities;
    private long completedActivities;
    private long cancelledActivities;
    private long overdueActivities;

    // By type
    private long taskCount;
    private long emailCount;
    private long callCount;
    private long meetingCount;
    private long noteCount;

    // By status
    private long pendingCount;
    private long inProgressCount;
    private long completedCount;

    // By priority
    private long urgentCount;
    private long highCount;
    private long mediumCount;
    private long lowCount;

    // Time metrics
    private double averageDurationMinutes;
    private long totalCallDuration;
    private long totalMeetingDuration;
}
