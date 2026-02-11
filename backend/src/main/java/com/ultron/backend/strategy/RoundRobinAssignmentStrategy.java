package com.ultron.backend.strategy;

import com.ultron.backend.domain.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Round-robin assignment strategy
 * Assigns leads to users in a circular fashion
 */
@Slf4j
@Component("roundRobinStrategy")
public class RoundRobinAssignmentStrategy implements LeadAssignmentStrategy {

    @Override
    public User selectUser(List<User> eligibleUsers, Integer lastAssignedIndex) {
        if (eligibleUsers == null || eligibleUsers.isEmpty()) {
            throw new IllegalArgumentException("No eligible users available for assignment");
        }

        // Initialize index if null
        if (lastAssignedIndex == null) {
            lastAssignedIndex = -1;
        }

        // Move to next user in round-robin fashion
        int nextIndex = (lastAssignedIndex + 1) % eligibleUsers.size();
        User selectedUser = eligibleUsers.get(nextIndex);

        log.info("Round-robin: Selected user {} (index: {})", selectedUser.getEmail(), nextIndex);
        return selectedUser;
    }

    @Override
    public String getStrategyName() {
        return "ROUND_ROBIN";
    }
}
