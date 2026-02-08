package com.ultron.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserActivityStatsResponse {

    // Total activity count
    private Long totalActivities;

    // Count by action type
    private Map<String, Long> actionTypeCounts;

    // Count by entity type
    private Map<String, Long> entityTypeCounts;

    // Most active users (for admin view)
    private Map<String, Long> userActivityCounts;

    // Daily activity count (for charts)
    private Map<String, Long> dailyActivityCounts;

    // Recent activity summary
    private Long todayCount;
    private Long thisWeekCount;
    private Long thisMonthCount;
}
