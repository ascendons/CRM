package com.ultron.backend.service;

import com.ultron.backend.domain.entity.WebForm;
import com.ultron.backend.domain.entity.WebFormSubmission;
import com.ultron.backend.dto.request.CreateWebFormRequest;
import com.ultron.backend.repository.WebFormRepository;
import com.ultron.backend.repository.WebFormSubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebFormService extends BaseTenantService {

    private final WebFormRepository formRepository;
    private final WebFormSubmissionRepository submissionRepository;

    public WebForm createForm(CreateWebFormRequest request, String createdByUserId) {
        String tenantId = getCurrentTenantId();

        WebForm form = WebForm.builder()
                .formId("FORM-" + System.currentTimeMillis())
                .tenantId(tenantId)
                .name(request.getName())
                .fields(request.getFields() != null ? request.getFields() : new ArrayList<>())
                .submitAction(request.getSubmitAction())
                .redirectUrl(request.getRedirectUrl())
                .thankYouMessage(request.getThankYouMessage())
                .themeColor(request.getThemeColor())
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(createdByUserId)
                .updatedAt(LocalDateTime.now())
                .updatedBy(createdByUserId)
                .build();

        return formRepository.save(form);
    }

    public List<WebForm> getAllForms() {
        String tenantId = getCurrentTenantId();
        return formRepository.findByTenantIdAndIsDeletedFalse(tenantId);
    }

    public WebForm getFormById(String formId) {
        String tenantId = getCurrentTenantId();
        return formRepository.findByFormIdAndTenantId(formId, tenantId)
                .orElseThrow(() -> new RuntimeException("Form not found: " + formId));
    }

    public WebForm getFormByIdPublic(String formId) {
        return formRepository.findByFormId(formId)
                .orElseThrow(() -> new RuntimeException("Form not found: " + formId));
    }

    public WebForm updateForm(String formId, CreateWebFormRequest request, String updatedByUserId) {
        String tenantId = getCurrentTenantId();
        WebForm form = formRepository.findByFormIdAndTenantId(formId, tenantId)
                .orElseThrow(() -> new RuntimeException("Form not found: " + formId));

        if (request.getName() != null) form.setName(request.getName());
        if (request.getFields() != null) form.setFields(request.getFields());
        if (request.getSubmitAction() != null) form.setSubmitAction(request.getSubmitAction());
        if (request.getRedirectUrl() != null) form.setRedirectUrl(request.getRedirectUrl());
        if (request.getThankYouMessage() != null) form.setThankYouMessage(request.getThankYouMessage());
        if (request.getThemeColor() != null) form.setThemeColor(request.getThemeColor());
        form.setUpdatedAt(LocalDateTime.now());
        form.setUpdatedBy(updatedByUserId);

        return formRepository.save(form);
    }

    public void deleteForm(String formId) {
        String tenantId = getCurrentTenantId();
        WebForm form = formRepository.findByFormIdAndTenantId(formId, tenantId)
                .orElseThrow(() -> new RuntimeException("Form not found: " + formId));
        form.setDeleted(true);
        form.setUpdatedAt(LocalDateTime.now());
        formRepository.save(form);
    }

    public WebFormSubmission submitForm(String formId, Map<String, String> responses, String ipAddress) {
        // Public endpoint - no tenant context needed
        WebForm form = formRepository.findByFormId(formId)
                .orElseThrow(() -> new RuntimeException("Form not found: " + formId));

        WebFormSubmission submission = WebFormSubmission.builder()
                .submissionId("SUB-" + System.currentTimeMillis())
                .tenantId(form.getTenantId())
                .formId(formId)
                .submittedAt(LocalDateTime.now())
                .ipAddress(ipAddress)
                .responses(responses)
                .build();

        return submissionRepository.save(submission);
    }

    public List<WebFormSubmission> getSubmissions(String formId) {
        String tenantId = getCurrentTenantId();
        return submissionRepository.findByTenantIdAndFormId(tenantId, formId);
    }

    public String getEmbedCode(String formId) {
        return String.format(
                "<script src=\"%s/embed/%s.js\"></script><div id=\"crm-form-%s\"></div>",
                "https://your-crm-domain.com", formId, formId
        );
    }
}
