package com.ultron.backend.strategy;

import com.ultron.backend.domain.entity.Lead;
import com.ultron.backend.domain.entity.User;
import com.ultron.backend.repository.LeadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Least-loaded assignment strategy
 * Assigns lead to user with the fewest currently assigned leads
 */
@Slf4j
@Component("leastLoadedStrategy")
@RequiredArgsConstructor
public class LeastLoadedAssignmentStrategy implements LeadAssignmentStrategy {

    private final LeadRepository leadRepository;

    @Override
    public User selectUser(List<User> eligibleUsers, Integer lastAssignedIndex) {
        if (eligibleUsers == null || eligibleUsers.isEmpty()) {
            throw new IllegalArgumentException("No eligible users available for assignment");
        }

        // Get all user IDs
        List<String> userIds = eligibleUsers.stream()
                .map(User::getId)
                .collect(Collectors.toList());

        // Count active leads per user
        Map<String, Long> leadCountsByUser = leadRepository
                .findByAssignedUserIdInAndIsDeletedFalse(userIds)
                .stream()
                .collect(Collectors.groupingBy(
                        Lead::getAssignedUserId,
                        Collectors.counting()
                ));

        // Find user with minimum lead count
        User selectedUser = eligibleUsers.stream()
                .min(Comparator.comparingLong(user ->
                        leadCountsByUser.getOrDefault(user.getId(), 0L)
                ))
                .orElse(eligibleUsers.get(0));

        long leadCount = leadCountsByUser.getOrDefault(selectedUser.getId(), 0L);
        log.info("Least-loaded: Selected user {} with {} assigned leads",
                selectedUser.getEmail(), leadCount);

        return selectedUser;
    }

    @Override
    public String getStrategyName() {
        return "LEAST_LOADED";
    }
}
