package com.ultron.backend.service;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.ultron.backend.domain.entity.Organization;
import com.ultron.backend.domain.entity.Proposal;
import com.ultron.backend.domain.enums.InvoiceTemplateType;
import com.ultron.backend.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

/**
 * Service for generating invoices using HTML templates
 * Supports multiple template types with HTML preview and PDF generation
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class InvoiceTemplateService {

    private final TemplateEngine templateEngine;

    /**
     * Generate HTML invoice for preview
     * @param proposal The proposal to generate invoice for
     * @param organization The organization details
     * @param templateType The template type to use
     * @return HTML string ready for preview
     */
    public String generateInvoiceHtml(
        Proposal proposal,
        Organization organization,
        InvoiceTemplateType templateType
    ) {
        log.info("Generating HTML invoice for proposal {} using template {}",
                proposal.getProposalNumber(), templateType);

        String templateName = getTemplateName(templateType);

        Context context = new Context();
        context.setVariable("proposal", proposal);
        context.setVariable("organization", organization);
        context.setVariable("templateType", templateType);

        try {
            return templateEngine.process(templateName, context);
        } catch (Exception e) {
            log.error("Failed to generate HTML for template {}: {}", templateType, e.getMessage(), e);
            throw new BadRequestException("Failed to generate invoice HTML: " + e.getMessage());
        }
    }

    /**
     * Generate PDF invoice from HTML template
     * @param proposal The proposal to generate invoice for
     * @param organization The organization details
     * @param templateType The template type to use
     * @return PDF as byte array
     */
    public byte[] generateInvoicePdf(
        Proposal proposal,
        Organization organization,
        InvoiceTemplateType templateType
    ) throws IOException {
        log.info("Generating PDF invoice for proposal {} using template {}",
                proposal.getProposalNumber(), templateType);

        String html = generateInvoiceHtml(proposal, organization, templateType);

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            // Clean HTML for better compatibility
            String cleanHtml = cleanHtmlForPdf(html);

            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(cleanHtml, "");  // Empty string as base URL
            builder.toStream(outputStream);
            builder.run();

            log.info("Successfully generated PDF for proposal {}", proposal.getProposalNumber());
            return outputStream.toByteArray();

        } catch (Exception e) {
            log.error("Failed to generate PDF for proposal {}: {}",
                    proposal.getProposalNumber(), e.getMessage(), e);
            throw new IOException("Failed to generate PDF: " + e.getMessage(), e);
        }
    }

    /**
     * Clean HTML for better PDF compatibility
     * Escape XML special characters that might break parsing
     */
    private String cleanHtmlForPdf(String html) {
        // Use regex to find content between tags and escape special characters
        // This is a simple approach - we escape & characters that aren't part of entities

        // First, protect existing entities by temporarily replacing them
        html = html.replaceAll("&(amp|lt|gt|quot|apos|#\\d+|#x[0-9A-Fa-f]+);", "____ENTITY_$1____");

        // Now escape any remaining & characters
        html = html.replace("&", "&amp;");

        // Restore the protected entities
        html = html.replaceAll("____ENTITY_(amp|lt|gt|quot|apos|#\\d+|#x[0-9A-Fa-f]+)____", "&$1;");

        // Ensure proper XHTML format
        if (!html.contains("<?xml")) {
            html = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" + html;
        }

        // Replace HTML5 doctype with XHTML doctype
        html = html.replace("<!DOCTYPE html>",
            "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" " +
            "\"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">");

        return html;
    }

    /**
     * Get template file name for the given template type
     * @param templateType The template type
     * @return Template file path (relative to templates directory)
     */
    private String getTemplateName(InvoiceTemplateType templateType) {
        return switch (templateType) {
            case PROFORMA -> "invoices/proforma-invoice";
            case PROFORMA_MODERN -> "invoices/proforma-modern";
            case PROFORMA_CLASSIC -> "invoices/proforma-classic";
            case QUOTATION -> "invoices/quotation";
            case TAX_INVOICE -> "invoices/tax-invoice";
            case COMMERCIAL -> "invoices/commercial-invoice";
            case MINIMAL -> "invoices/minimal-invoice";
        };
    }

    /**
     * Check if a template is available for the given type
     * @param templateType The template type to check
     * @return true if template exists, false otherwise
     */
    public boolean isTemplateAvailable(InvoiceTemplateType templateType) {
        return switch (templateType) {
            case PROFORMA, PROFORMA_MODERN, PROFORMA_CLASSIC, QUOTATION -> true;
            default -> false;
        };
    }
}
