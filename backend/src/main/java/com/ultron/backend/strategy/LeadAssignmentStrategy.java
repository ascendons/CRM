package com.ultron.backend.strategy;

import com.ultron.backend.domain.entity.User;

import java.util.List;

/**
 * Strategy interface for different lead assignment algorithms
 */
public interface LeadAssignmentStrategy {

    /**
     * Select a user from the eligible users list
     *
     * @param eligibleUsers List of active users with eligible roles
     * @param lastAssignedIndex For round-robin: index of last assigned user
     * @return Selected user for assignment
     */
    User selectUser(List<User> eligibleUsers, Integer lastAssignedIndex);

    /**
     * Get the strategy name
     */
    String getStrategyName();
}
