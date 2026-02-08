package com.ultron.backend.dto.request;

import com.ultron.backend.domain.entity.UserActivity.ActionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserActivityFilterRequest {

    // Filtering
    private String userId;
    private ActionType actionType;
    private String entityType;
    private String entityId;

    // Date range
    private LocalDateTime startDate;
    private LocalDateTime endDate;

    // Pagination
    private Integer page = 0;
    private Integer size = 20;

    // Sorting
    private String sortBy = "timestamp";
    private String sortDirection = "DESC";
}
