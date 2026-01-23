package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Lead;
import com.ultron.backend.domain.enums.CompanySize;
import org.springframework.stereotype.Service;

/**
 * Service to calculate lead scores based on demographic and behavioral factors
 * Total Score = Demographic Score (max 40) + Behavioral Score (max 60) = 0-100
 */
@Service
public class LeadScoringService {

    /**
     * Calculate total lead score
     */
    public void calculateLeadScore(Lead lead) {
        int demographicScore = calculateDemographicScore(lead);
        int behavioralScore = calculateBehavioralScore(lead);

        int totalScore = demographicScore + behavioralScore;
        totalScore = Math.min(100, Math.max(0, totalScore)); // Clamp between 0-100

        lead.setDemographicScore(demographicScore);
        lead.setBehavioralScore(behavioralScore);
        lead.setLeadScore(totalScore);
        lead.setLeadGrade(calculateLeadGrade(totalScore));
    }

    /**
     * Calculate demographic score (max 40 points)
     * = Company Size (15) + Job Title (15) + Industry (10)
     */
    private int calculateDemographicScore(Lead lead) {
        int companySizeScore = calculateCompanySizeScore(lead.getCompanySize());
        int jobTitleScore = calculateJobTitleScore(lead.getJobTitle());
        int industryScore = calculateIndustryScore(lead.getIndustry());

        int total = companySizeScore + jobTitleScore + industryScore;
        return Math.min(40, total);
    }

    /**
     * Company Size Scoring (max 15 points)
     */
    private int calculateCompanySizeScore(CompanySize companySize) {
        if (companySize == null) return 0;

        return switch (companySize) {
            case ENTERPRISE -> 15;  // 500+
            case LARGE -> 12;       // 201-500
            case MEDIUM -> 9;       // 51-200
            case SMALL -> 6;        // 11-50
            case MICRO -> 3;        // 1-10
        };
    }

    /**
     * Job Title/Role Scoring (max 15 points)
     * Based on decision-making authority keywords
     */
    private int calculateJobTitleScore(String jobTitle) {
        if (jobTitle == null || jobTitle.isEmpty()) return 0;

        String lowerTitle = jobTitle.toLowerCase();

        // C-Level Executive (15 points)
        if (lowerTitle.matches(".*(ceo|cto|cfo|cmo|coo|chief|president).*")) {
            return 15;
        }
        // Vice President (12 points)
        if (lowerTitle.matches(".*(vp|vice president|svp|senior vice president).*")) {
            return 12;
        }
        // Director (10 points)
        if (lowerTitle.matches(".*(director|head of).*")) {
            return 10;
        }
        // Manager (8 points)
        if (lowerTitle.matches(".*(manager|mgr|lead).*")) {
            return 8;
        }
        // Executive/Specialist (5 points)
        if (lowerTitle.matches(".*(executive|specialist|senior|coordinator).*")) {
            return 5;
        }

        return 0;
    }

    /**
     * Industry Match Scoring (max 10 points)
     * TODO: Make target industries configurable
     * For now, using Technology, Finance, Healthcare as target industries
     */
    private int calculateIndustryScore(com.ultron.backend.domain.enums.Industry industry) {
        if (industry == null) return 0;

        // Target industries (10 points)
        if (industry == com.ultron.backend.domain.enums.Industry.TECHNOLOGY ||
                industry == com.ultron.backend.domain.enums.Industry.FINANCE ||
                industry == com.ultron.backend.domain.enums.Industry.HEALTHCARE) {
            return 10;
        }

        // Adjacent industries (5 points)
        if (industry == com.ultron.backend.domain.enums.Industry.PROFESSIONAL_SERVICES ||
                industry == com.ultron.backend.domain.enums.Industry.CONSULTING ||
                industry == com.ultron.backend.domain.enums.Industry.MANUFACTURING) {
            return 5;
        }

        return 0;
    }

    /**
     * Calculate behavioral score (max 60 points)
     * Based on engagement activities
     *
     * TODO: Implement when activity tracking is added:
     * - Email opens/clicks
     * - Website visits
     * - Content downloads
     * - Form submissions
     * - Direct engagement
     */
    private int calculateBehavioralScore(Lead lead) {
        // Placeholder - will be implemented when activity tracking is added
        // For now, return 0
        return 0;
    }

    /**
     * Calculate lead grade based on score
     * A: 80-100 (Hot Lead)
     * B: 60-79 (Warm Lead)
     * C: 40-59 (Cold Lead)
     * D: 0-39 (Very Cold)
     */
    private String calculateLeadGrade(int score) {
        if (score >= 80) return "A";
        if (score >= 60) return "B";
        if (score >= 40) return "C";
        return "D";
    }

    /**
     * Calculate BANT qualification score (max 100 points)
     * Budget (25) + Authority (25) + Need (25) + Timeline (25)
     */
    public void calculateQualificationScore(Lead lead) {
        int budgetScore = calculateBudgetScore(lead);
        int authorityScore = calculateAuthorityScore(lead);
        int needScore = calculateNeedScore(lead);
        int timelineScore = calculateTimelineScore(lead);

        int total = budgetScore + authorityScore + needScore + timelineScore;
        lead.setQualificationScore(Math.min(100, total));
    }

    private int calculateBudgetScore(Lead lead) {
        if (Boolean.FALSE.equals(lead.getHasBudget())) return 0;
        if (lead.getHasBudget() == null) return 10;

        if (lead.getBudgetAmount() != null && lead.getBudgetTimeframe() != null) {
            return 25;
        }
        if (lead.getBudgetAmount() != null) {
            return 20;
        }
        return 15;
    }

    private int calculateAuthorityScore(Lead lead) {
        if (Boolean.TRUE.equals(lead.getIsDecisionMaker())) return 25;

        if (Boolean.FALSE.equals(lead.getIsDecisionMaker())) {
            if (lead.getDecisionMakerName() != null && lead.getDecisionMakerContact() != null) {
                return 20;
            }
            if (lead.getDecisionMakerName() != null) {
                return 15;
            }
            return 10;
        }

        return 0;
    }

    private int calculateNeedScore(Lead lead) {
        int score = 0;
        if (lead.getBusinessProblem() != null && !lead.getBusinessProblem().isEmpty()) score += 10;
        if (lead.getPainPoints() != null && !lead.getPainPoints().isEmpty()) score += 8;
        if (lead.getCurrentSolution() != null && !lead.getCurrentSolution().isEmpty()) score += 4;
        if (lead.getWhyChangeNow() != null && !lead.getWhyChangeNow().isEmpty()) score += 3;

        return Math.min(25, score);
    }

    private int calculateTimelineScore(Lead lead) {
        int score = 0;
        if (lead.getExpectedPurchaseDate() != null) score += 10;
        if (lead.getProjectStartDate() != null) score += 5;
        if (lead.getUrgencyLevel() != null && !lead.getUrgencyLevel().isEmpty()) score += 5;
        if (lead.getTimelineDrivers() != null && !lead.getTimelineDrivers().isEmpty()) score += 5;

        return Math.min(25, score);
    }
}
