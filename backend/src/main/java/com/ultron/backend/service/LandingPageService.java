package com.ultron.backend.service;

import com.ultron.backend.domain.entity.LandingPage;
import com.ultron.backend.dto.request.CreateLandingPageRequest;
import com.ultron.backend.repository.LandingPageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LandingPageService extends BaseTenantService {

    private final LandingPageRepository landingPageRepository;

    public LandingPage createLandingPage(CreateLandingPageRequest request, String createdByUserId) {
        String tenantId = getCurrentTenantId();

        LandingPage page = LandingPage.builder()
                .pageId("LP-" + System.currentTimeMillis())
                .tenantId(tenantId)
                .slug(request.getSlug())
                .title(request.getTitle())
                .heroText(request.getHeroText())
                .ctaText(request.getCtaText())
                .formId(request.getFormId())
                .heroImageUrl(request.getHeroImageUrl())
                .published(request.isPublished())
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(createdByUserId)
                .updatedAt(LocalDateTime.now())
                .updatedBy(createdByUserId)
                .build();

        return landingPageRepository.save(page);
    }

    public List<LandingPage> getAllPages() {
        String tenantId = getCurrentTenantId();
        return landingPageRepository.findByTenantIdAndIsDeletedFalse(tenantId);
    }

    public LandingPage getPageById(String pageId) {
        String tenantId = getCurrentTenantId();
        return landingPageRepository.findByPageIdAndTenantId(pageId, tenantId)
                .orElseThrow(() -> new RuntimeException("Landing page not found: " + pageId));
    }

    public LandingPage getPageBySlug(String slug) {
        return landingPageRepository.findBySlugAndPublishedTrueAndIsDeletedFalse(slug)
                .orElseThrow(() -> new RuntimeException("Landing page not found: " + slug));
    }

    public LandingPage publishPage(String pageId, String updatedByUserId) {
        String tenantId = getCurrentTenantId();
        LandingPage page = landingPageRepository.findByPageIdAndTenantId(pageId, tenantId)
                .orElseThrow(() -> new RuntimeException("Landing page not found: " + pageId));

        page.setPublished(true);
        page.setUpdatedAt(LocalDateTime.now());
        page.setUpdatedBy(updatedByUserId);

        return landingPageRepository.save(page);
    }

    public LandingPage unpublishPage(String pageId, String updatedByUserId) {
        String tenantId = getCurrentTenantId();
        LandingPage page = landingPageRepository.findByPageIdAndTenantId(pageId, tenantId)
                .orElseThrow(() -> new RuntimeException("Landing page not found: " + pageId));

        page.setPublished(false);
        page.setUpdatedAt(LocalDateTime.now());
        page.setUpdatedBy(updatedByUserId);

        return landingPageRepository.save(page);
    }

    public void deletePage(String pageId) {
        String tenantId = getCurrentTenantId();
        LandingPage page = landingPageRepository.findByPageIdAndTenantId(pageId, tenantId)
                .orElseThrow(() -> new RuntimeException("Landing page not found: " + pageId));
        page.setDeleted(true);
        page.setUpdatedAt(LocalDateTime.now());
        landingPageRepository.save(page);
    }
}
