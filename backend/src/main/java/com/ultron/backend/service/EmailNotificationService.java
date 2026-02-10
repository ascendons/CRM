package com.ultron.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Email notification service
 * Handles sending various email notifications to users
 *
 * NOTE: This is a stub implementation. In production, integrate with:
 * - SendGrid
 * - AWS SES
 * - Mailgun
 * - or other email service providers
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailNotificationService {

    /**
     * Send invitation email to user
     */
    public void sendInvitationEmail(String toEmail, String organizationName,
                                     String inviterName, String invitationId,
                                     String personalMessage) {
        log.info("Sending invitation email to: {}", toEmail);

        // TODO: Implement actual email sending
        String acceptUrl = String.format("https://yourcrm.com/accept-invitation/%s", invitationId);

        String emailBody = buildInvitationEmail(
                organizationName, inviterName, acceptUrl, personalMessage
        );

        // Stub: Just log the email content
        log.info("Email Content:\n{}", emailBody);

        // In production:
        // emailProvider.send(toEmail, "You're invited to join " + organizationName, emailBody);
    }

    /**
     * Send welcome email to new user
     */
    public void sendWelcomeEmail(String toEmail, String fullName, String organizationName) {
        log.info("Sending welcome email to: {}", toEmail);

        String emailBody = String.format("""
                Hi %s,

                Welcome to %s on CRM Platform!

                You can now access your dashboard and start managing your leads, contacts, and opportunities.

                Best regards,
                CRM Team
                """, fullName, organizationName);

        log.info("Email Content:\n{}", emailBody);
    }

    /**
     * Send password reset email
     */
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        log.info("Sending password reset email to: {}", toEmail);

        String resetUrl = String.format("https://yourcrm.com/reset-password/%s", resetToken);

        String emailBody = String.format("""
                Password Reset Request

                Click the link below to reset your password:
                %s

                This link expires in 1 hour.

                If you didn't request this, please ignore this email.

                Best regards,
                CRM Team
                """, resetUrl);

        log.info("Email Content:\n{}", emailBody);
    }

    /**
     * Send subscription expiry notification
     */
    public void sendSubscriptionExpiryNotification(String toEmail, String organizationName,
                                                     String expiryDate) {
        log.info("Sending subscription expiry notification to: {}", toEmail);

        String emailBody = String.format("""
                Subscription Expiring Soon

                Your organization "%s" subscription will expire on %s.

                Please renew your subscription to continue using CRM services.

                Best regards,
                CRM Team
                """, organizationName, expiryDate);

        log.info("Email Content:\n{}", emailBody);
    }

    /**
     * Send usage limit warning
     */
    public void sendUsageLimitWarning(String toEmail, String organizationName,
                                       String resourceType, int currentUsage, int limit) {
        log.info("Sending usage limit warning to: {}", toEmail);

        String emailBody = String.format("""
                Usage Limit Warning

                Your organization "%s" is approaching the %s limit.

                Current usage: %d / %d (%.0f%%)

                Consider upgrading your plan for more resources.

                Best regards,
                CRM Team
                """, organizationName, resourceType, currentUsage, limit,
                (double) currentUsage / limit * 100);

        log.info("Email Content:\n{}", emailBody);
    }

    private String buildInvitationEmail(String organizationName, String inviterName,
                                         String acceptUrl, String personalMessage) {
        StringBuilder email = new StringBuilder();
        email.append(String.format("You've been invited to join %s\n\n", organizationName));
        email.append(String.format("%s has invited you to join their team on CRM Platform.\n\n", inviterName));

        if (personalMessage != null && !personalMessage.isEmpty()) {
            email.append(String.format("Personal message:\n\"%s\"\n\n", personalMessage));
        }

        email.append("Click the link below to accept the invitation and create your account:\n");
        email.append(String.format("%s\n\n", acceptUrl));
        email.append("This invitation expires in 7 days.\n\n");
        email.append("Best regards,\nCRM Team");

        return email.toString();
    }
}
