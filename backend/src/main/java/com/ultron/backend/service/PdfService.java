package com.ultron.backend.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.ultron.backend.domain.entity.Proposal;
import com.ultron.backend.domain.enums.DiscountType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@Slf4j
@RequiredArgsConstructor
public class PdfService {

    private final ProductService productService;
    private final com.ultron.backend.repository.OrganizationRepository organizationRepository;

    // Method removed. ProposalService handles fetching and calls generateProposalPdf(Proposal)

    public byte[] generateProposalPdf(Proposal proposal) throws IOException {
        String tenantId = proposal.getTenantId();
        com.ultron.backend.domain.entity.Organization organization = organizationRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));
        com.ultron.backend.domain.entity.Organization.InvoiceConfig config = organization.getInvoiceConfig();

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, out);

            document.open();

            addHeader(document, proposal, organization);
            addBillToShipTo(document, proposal);
            addLineItems(document, proposal);
            addTotalsAndBankDetails(document, proposal, config);
            addFooter(document, config);

            document.close();
            return out.toByteArray();
        }
    }

    private void addHeader(Document document, Proposal proposal, com.ultron.backend.domain.entity.Organization organization) throws DocumentException {
        com.ultron.backend.domain.entity.Organization.InvoiceConfig config = organization.getInvoiceConfig();
        com.ultron.backend.domain.entity.Organization.OrganizationSettings settings = organization.getSettings();

        // Top Section: Logo/Address on Left, Title on Right
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{3.5f, 1.5f});

        // Left Column: Logo + Address combined
        PdfPTable leftHeaderTable = new PdfPTable(2);
        leftHeaderTable.setWidthPercentage(100);
        leftHeaderTable.setWidths(new float[]{1, 3});
        
        // Logo
        PdfPCell logoCell = new PdfPCell();
        logoCell.setBorder(Rectangle.NO_BORDER);
        String logoUrl = (config != null && config.getLogoUrl() != null && !config.getLogoUrl().isEmpty()) 
                ? config.getLogoUrl() 
                : (settings != null ? settings.getLogoUrl() : null);

        if (logoUrl != null && !logoUrl.isEmpty()) {
            try {
                Image logo;
                if (logoUrl.startsWith("data:")) {
                    String base64Data = logoUrl.substring(logoUrl.indexOf(",") + 1);
                    byte[] imageBytes = java.util.Base64.getDecoder().decode(base64Data);
                    logo = Image.getInstance(imageBytes);
                } else {
                    logo = Image.getInstance(new java.net.URL(logoUrl));
                }
                logo.scaleToFit(80, 60);
                logoCell.addElement(logo);
            } catch (Exception e) {
                log.error("Failed to load logo: {}", e.getMessage());
            }
        }
        leftHeaderTable.addCell(logoCell);
        
        // Address/Company Details
        PdfPCell addressCell = new PdfPCell();
        addressCell.setBorder(Rectangle.NO_BORDER);
        addressCell.setPaddingLeft(10);
        
        Font companyNameFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        String compName = "Ultron CRM Inc.";
        if (config != null && config.getCompanyName() != null && !config.getCompanyName().isEmpty()) {
            compName = config.getCompanyName();
        } else if (organization.getDisplayName() != null && !organization.getDisplayName().isEmpty()) {
            compName = organization.getDisplayName();
        } else if (organization.getOrganizationName() != null && !organization.getOrganizationName().isEmpty()) {
            compName = organization.getOrganizationName();
        }
        addressCell.addElement(new Paragraph(compName, companyNameFont));
        
        Font addressFont = FontFactory.getFont(FontFactory.HELVETICA, 8);
        String address = (config != null && config.getCompanyAddress() != null) ? config.getCompanyAddress() : "123 Tech Park, Innovation Way\nSilicon Valley, CA 94025";
        addressCell.addElement(new Paragraph(address, addressFont));
        
        if (config != null && config.getGstNumber() != null && !config.getGstNumber().isEmpty()) {
            addressCell.addElement(new Paragraph("GST: " + config.getGstNumber(), addressFont));
        }
        if (config != null && config.getCinNumber() != null && !config.getCinNumber().isEmpty()) {
            addressCell.addElement(new Paragraph("CIN: " + config.getCinNumber(), addressFont));
        }
        leftHeaderTable.addCell(addressCell);
        
        PdfPCell combinedLeftCell = new PdfPCell(leftHeaderTable);
        combinedLeftCell.setBorder(Rectangle.NO_BORDER);
        headerTable.addCell(combinedLeftCell);

        // Right Column: Title
        PdfPCell titleCell = new PdfPCell();
        titleCell.setBorder(Rectangle.NO_BORDER);
        titleCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        Paragraph invoiceTitle = new Paragraph("PROFORMA INVOICE", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14));
        invoiceTitle.setAlignment(Element.ALIGN_RIGHT);
        titleCell.addElement(invoiceTitle);
        headerTable.addCell(titleCell);
        
        document.add(headerTable);

        // Blue Separator Line
        PdfPTable separatorTable = new PdfPTable(1);
        separatorTable.setWidthPercentage(100);
        PdfPCell separatorCell = new PdfPCell();
        separatorCell.setBorder(Rectangle.TOP);
        separatorCell.setBorderWidthTop(2f);
        separatorCell.setBorderColorTop(new Color(0, 51, 153));
        separatorCell.setPadding(0);
        separatorTable.addCell(separatorCell);
        document.add(separatorTable);

        // Reference / Date Section
        document.add(new Paragraph(" "));
        PdfPTable refTable = new PdfPTable(2);
        refTable.setWidthPercentage(100);
        Font refFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
        
        PdfPCell refCell = new PdfPCell(new Phrase("Ref No.: " + proposal.getProposalNumber(), refFont));
        refCell.setBorder(Rectangle.TOP | Rectangle.BOTTOM);
        refCell.setPadding(5);
        refTable.addCell(refCell);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy");
        String dateStr = proposal.getCreatedAt() != null ? proposal.getCreatedAt().format(formatter) : "";
        PdfPCell dateCell = new PdfPCell(new Phrase("Date: " + dateStr, refFont));
        dateCell.setBorder(Rectangle.TOP | Rectangle.BOTTOM);
        dateCell.setPadding(5);
        dateCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        refTable.addCell(dateCell);

        document.add(refTable);
    }

    private void addBillToShipTo(Document document, Proposal proposal) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1, 1});
        table.setSpacingBefore(10);

        Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
        Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 8);

        // BILL TO
        PdfPCell billTo = new PdfPCell();
        billTo.setBorder(Rectangle.NO_BORDER);
        billTo.addElement(new Paragraph("BILL TO:", headFont));
        billTo.addElement(new Paragraph(proposal.getCustomerName(), headFont));
        
        if (proposal.getBillingAddress() != null) {
             String addr = (proposal.getBillingAddress().getStreet() != null ? proposal.getBillingAddress().getStreet() : "") + "\n" +
                           (proposal.getBillingAddress().getCity() != null ? proposal.getBillingAddress().getCity() : "") + ", " + 
                           (proposal.getBillingAddress().getState() != null ? proposal.getBillingAddress().getState() : "") + "\n" +
                           (proposal.getBillingAddress().getCountry() != null ? proposal.getBillingAddress().getCountry() : "") + " - " + 
                           (proposal.getBillingAddress().getPostalCode() != null ? proposal.getBillingAddress().getPostalCode() : "");
             billTo.addElement(new Paragraph(addr, bodyFont));
        }
        
        // Add GSTIN/MOB NO/EMAIL if available in extras (placeholder for now as Proposal entity doesn't have these explicitly)
        // If they are in customer metadata, they should be here
        if (proposal.getCustomerEmail() != null) billTo.addElement(new Paragraph("EMAIL: " + proposal.getCustomerEmail(), bodyFont));
        if (proposal.getCustomerPhone() != null) billTo.addElement(new Paragraph("MOB NO.: " + proposal.getCustomerPhone(), bodyFont));
        
        table.addCell(billTo);

        // SHIP TO
        PdfPCell shipTo = new PdfPCell();
        shipTo.setBorder(Rectangle.NO_BORDER);
        shipTo.addElement(new Paragraph("SHIP TO:", headFont));
        shipTo.addElement(new Paragraph(proposal.getCustomerName(), headFont));
        
        if (proposal.getShippingAddress() != null) {
             String addr = (proposal.getShippingAddress().getStreet() != null ? proposal.getShippingAddress().getStreet() : "") + "\n" +
                           (proposal.getShippingAddress().getCity() != null ? proposal.getShippingAddress().getCity() : "") + ", " + 
                           (proposal.getShippingAddress().getState() != null ? proposal.getShippingAddress().getState() : "") + "\n" +
                           (proposal.getShippingAddress().getCountry() != null ? proposal.getShippingAddress().getCountry() : "") + " - " + 
                           (proposal.getShippingAddress().getPostalCode() != null ? proposal.getShippingAddress().getPostalCode() : "");
             shipTo.addElement(new Paragraph(addr, bodyFont));
        } else if (proposal.getBillingAddress() != null) {
             // Fallback to billing
             String addr = (proposal.getBillingAddress().getStreet() != null ? proposal.getBillingAddress().getStreet() : "") + "\n" +
                           (proposal.getBillingAddress().getCity() != null ? proposal.getBillingAddress().getCity() : "") + ", " + 
                           (proposal.getBillingAddress().getState() != null ? proposal.getBillingAddress().getState() : "") + "\n" +
                           (proposal.getBillingAddress().getCountry() != null ? proposal.getBillingAddress().getCountry() : "") + " - " + 
                           (proposal.getBillingAddress().getPostalCode() != null ? proposal.getBillingAddress().getPostalCode() : "");
             shipTo.addElement(new Paragraph(addr, bodyFont));
        }
        table.addCell(shipTo);

        document.add(table);
    }

    private void addLineItems(Document document, Proposal proposal) throws DocumentException {
        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{0.5f, 3.5f, 1f, 1f, 1.2f, 1.5f});
        table.setHeaderRows(1);
        table.setSpacingBefore(10);

        // Header Styling
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8);
        String[] headers = {"SR NO", "DESCRIPTION", "HSN/SAC", "QTY", "RATE", "AMOUNT"};
        
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            cell.setPadding(5);
            cell.setBackgroundColor(new Color(245, 245, 245));
            table.addCell(cell);
        }

        // Data
        Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 8);
        NumberFormat currency = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));
        int srNo = 1;

        for (Proposal.ProposalLineItem item : proposal.getLineItems()) {
            addCell(table, String.valueOf(srNo++), Element.ALIGN_CENTER, cellFont);
            
            // Description
            String desc = item.getProductName();
            if (item.getDescription() != null && !item.getDescription().isEmpty()) {
                desc += "\n" + item.getDescription();
            }
            addCell(table, desc, Element.ALIGN_LEFT, cellFont);
            
            // HSN/SAC
            String hsn = (item.getHsnCode() != null && !item.getHsnCode().isEmpty()) ? item.getHsnCode() : "";
            addCell(table, hsn, Element.ALIGN_CENTER, cellFont);
            
            // Quantity (including unit if present)
            String qty = String.valueOf(item.getQuantity()) + (item.getUnit() != null ? " (" + item.getUnit() + ")" : "");
            addCell(table, qty, Element.ALIGN_CENTER, cellFont);
            
            // Rate
            addCell(table, currency.format(item.getUnitPrice()), Element.ALIGN_RIGHT, cellFont);
            
            // Amount (Line Subtotal)
            addCell(table, currency.format(item.getLineSubtotal()), Element.ALIGN_RIGHT, cellFont);
        }

        document.add(table);
    }

    private void addCell(PdfPTable table, String text, int align, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(align);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(5);
        table.addCell(cell);
    }

    private void addTotalsAndBankDetails(Document document, Proposal proposal, com.ultron.backend.domain.entity.Organization.InvoiceConfig config) throws DocumentException {
        PdfPTable mainTable = new PdfPTable(2);
        mainTable.setWidthPercentage(100);
        mainTable.setWidths(new float[]{1.3f, 1f});
        
        Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 8);

        // Left Side: Terms or Empty space
        PdfPCell leftSpace = new PdfPCell();
        leftSpace.setBorder(Rectangle.NO_BORDER);
        mainTable.addCell(leftSpace);

        // Right Side: Totals Table
        PdfPTable totalsTable = new PdfPTable(2);
        totalsTable.setWidthPercentage(100);
        
        addTotalRow(totalsTable, "TAXABLE AMOUNT:", proposal.getSubtotal(), boldFont);
        if (proposal.getTaxAmount() != null && proposal.getTaxAmount().compareTo(BigDecimal.ZERO) > 0) {
            addTotalRow(totalsTable, "TOTAL GST:", proposal.getTaxAmount(), boldFont);
        }
        addTotalRow(totalsTable, "TOTAL AMOUNT:", proposal.getTotalAmount(), boldFont);
        
        BigDecimal payable = proposal.getTotalAmount();
        if (proposal.getPaymentMilestones() != null && !proposal.getPaymentMilestones().isEmpty() && proposal.getCurrentMilestoneIndex() != null) {
            int currentIndex = proposal.getCurrentMilestoneIndex();
            if (currentIndex < proposal.getPaymentMilestones().size()) {
                payable = proposal.getTotalAmount().multiply(proposal.getPaymentMilestones().get(currentIndex).getPercentage()).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
            }
        }
        addTotalRow(totalsTable, "PAYABLE VALUE:", payable, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9));
        
        PdfPCell totalsCell = new PdfPCell(totalsTable);
        totalsCell.setBorder(Rectangle.NO_BORDER);
        mainTable.addCell(totalsCell);
        document.add(mainTable);

        // Terms and Bank Section
        document.add(new Paragraph(" "));
        PdfPTable bottomTable = new PdfPTable(2);
        bottomTable.setWidthPercentage(100);
        bottomTable.setWidths(new float[]{1.2f, 1f});

        // Left: Terms
        PdfPCell termsCell = new PdfPCell();
        termsCell.setBorder(Rectangle.NO_BORDER);
        termsCell.addElement(new Paragraph("TERMS & CONDITIONS", boldFont));
        String terms = (config != null && config.getTermsAndConditions() != null) ? config.getTermsAndConditions() : "1. Validity: Offer Valid Only for 30 Days";
        termsCell.addElement(new Paragraph(terms, normalFont));
        bottomTable.addCell(termsCell);

        // Right: Bank Details
        PdfPCell bankCell = new PdfPCell();
        bankCell.setBorder(Rectangle.NO_BORDER);
        bankCell.addElement(new Paragraph("OUR BANK DETAILS", boldFont));
        if (config != null && config.getBankName() != null) {
            Paragraph bankInfo = new Paragraph();
            bankInfo.setFont(normalFont);
            bankInfo.add(new Chunk("Bank Name: ", boldFont));
            bankInfo.add(new Chunk(config.getBankName() + "\n", normalFont));
            bankInfo.add(new Chunk("Account Details: ", boldFont));
            bankInfo.add(new Chunk(config.getAccountNumber() + "\n", normalFont));
            bankInfo.add(new Chunk("Branch & IFSC Code: ", boldFont));
            bankInfo.add(new Chunk(config.getBranchName() + " (" + config.getIfscCode() + ")\n", normalFont));
            bankCell.addElement(bankInfo);
        } else {
            bankCell.addElement(new Paragraph("Bank Details Not Configured", normalFont));
        }
        bottomTable.addCell(bankCell);

        document.add(bottomTable);
    }

    private void addTotalRow(PdfPTable table, String label, BigDecimal value, Font font) {
        NumberFormat currency = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));
        
        PdfPCell labelCell = new PdfPCell(new Phrase(label, font));
        labelCell.setBorder(Rectangle.BOX);
        labelCell.setPadding(5);
        labelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(currency.format(value), font));
        valueCell.setBorder(Rectangle.BOX);
        valueCell.setPadding(5);
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(valueCell);
    }

    private void addFooter(Document document, com.ultron.backend.domain.entity.Organization.InvoiceConfig config) throws DocumentException {
        document.add(new Paragraph(" "));
        
        PdfPTable footerTable = new PdfPTable(2);
        footerTable.setWidthPercentage(100);
        
        PdfPCell leftFooter = new PdfPCell();
        leftFooter.setBorder(Rectangle.NO_BORDER);
        
        if (config != null && config.getAuthorizedSignatorySealUrl() != null && !config.getAuthorizedSignatorySealUrl().isEmpty()) {
            String sealUrl = config.getAuthorizedSignatorySealUrl();
            try {
                Image seal;
                if (sealUrl.startsWith("data:")) {
                    String base64Data = sealUrl.substring(sealUrl.indexOf(",") + 1);
                    byte[] imageBytes = java.util.Base64.getDecoder().decode(base64Data);
                    seal = Image.getInstance(imageBytes);
                } else {
                    seal = Image.getInstance(new java.net.URL(sealUrl));
                }
                
                seal.scaleToFit(80, 80);
                leftFooter.addElement(seal);
            } catch (Exception e) {
                log.error("Failed to load signatory seal: {}", e.getMessage());
            }
        }
        
        String signLabel = (config != null && config.getAuthorizedSignatoryLabel() != null) ? config.getAuthorizedSignatoryLabel() : "Authorized Signatory";
        leftFooter.addElement(new Paragraph(signLabel, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8)));
        footerTable.addCell(leftFooter);
        
        PdfPCell rightFooter = new PdfPCell();
        rightFooter.setBorder(Rectangle.NO_BORDER);
        footerTable.addCell(rightFooter);
        
        document.add(footerTable);

        // Bottom Info (Website and Email)
        PdfPTable bottomInfo = new PdfPTable(1);
        bottomInfo.setWidthPercentage(100);
        bottomInfo.setSpacingBefore(30);
        
        String footerText = (config != null && config.getFooterText() != null) ? config.getFooterText() : "www.ultron.com | info@ultron.com";
        PdfPCell infoCell = new PdfPCell(new Phrase(footerText, FontFactory.getFont(FontFactory.HELVETICA, 7)));
        infoCell.setBorder(Rectangle.NO_BORDER);
        infoCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        bottomInfo.addCell(infoCell);
        
        document.add(bottomInfo);
    }
}
