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

            addHeader(document, proposal, config);
            addBillToShipTo(document, proposal);
            addLineItems(document, proposal);
            addTotalsAndBankDetails(document, proposal, config);
            addFooter(document, config);

            document.close();
            return out.toByteArray();
        }
    }

    private void addHeader(Document document, Proposal proposal, com.ultron.backend.domain.entity.Organization.InvoiceConfig config) throws DocumentException {
        // Logo and Company Details (Top Left)
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{3, 1});

        // Left: Company Logo & Address
        PdfPCell companyCell = new PdfPCell();
        companyCell.setBorder(Rectangle.NO_BORDER);
        
        // Handle Logo if present
        if (config != null && config.getLogoUrl() != null && !config.getLogoUrl().isEmpty()) {
            try {
                Image logo = Image.getInstance(new java.net.URL(config.getLogoUrl()));
                logo.scaleToFit(100, 50);
                companyCell.addElement(logo);
            } catch (Exception e) {
                log.warn("Failed to load logo from URL: {}", config.getLogoUrl());
            }
        }
        
        Font companyNameFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
        String compName = (config != null && config.getCompanyName() != null) ? config.getCompanyName() : "Ultron CRM Inc.";
        companyCell.addElement(new Paragraph(compName, companyNameFont));
        
        Font addressFont = FontFactory.getFont(FontFactory.HELVETICA, 8);
        String address = (config != null && config.getCompanyAddress() != null) ? config.getCompanyAddress() : "123 Tech Park, Innovation Way\nSilicon Valley, CA 94025";
        companyCell.addElement(new Paragraph(address, addressFont));
        
        if (config != null && config.getGstNumber() != null) {
            companyCell.addElement(new Paragraph("GST: " + config.getGstNumber(), addressFont));
        }
        if (config != null && config.getCinNumber() != null) {
            companyCell.addElement(new Paragraph("CIN: " + config.getCinNumber(), addressFont));
        }
        
        headerTable.addCell(companyCell);

        // Right: Invoice Title
        PdfPCell titleCell = new PdfPCell();
        titleCell.setBorder(Rectangle.NO_BORDER);
        titleCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        titleCell.setVerticalAlignment(Element.ALIGN_TOP);
        
        Paragraph invoiceTitle = new Paragraph("PROFORMA INVOICE", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14));
        invoiceTitle.setAlignment(Element.ALIGN_RIGHT);
        titleCell.addElement(invoiceTitle);
        
        headerTable.addCell(titleCell);
        document.add(headerTable);

        // Separator Line
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
        document.add(new Paragraph(" "));
    }

    private void addBillToShipTo(Document document, Proposal proposal) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1, 1});

        Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
        Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9);

        // BILL TO
        PdfPCell billTo = new PdfPCell();
        billTo.setBorder(Rectangle.NO_BORDER);
        billTo.addElement(new Paragraph("BILL TO:", headFont));
        billTo.addElement(new Paragraph(proposal.getCustomerName(), headFont));
        
        if (proposal.getBillingAddress() != null) {
             String addr = proposal.getBillingAddress().getStreet() + "\n" +
                           proposal.getBillingAddress().getCity() + ", " + proposal.getBillingAddress().getState() + "\n" +
                           proposal.getBillingAddress().getCountry() + " - " + proposal.getBillingAddress().getPostalCode();
             billTo.addElement(new Paragraph(addr, bodyFont));
        }
        if (proposal.getCustomerEmail() != null) billTo.addElement(new Paragraph("EMAIL: " + proposal.getCustomerEmail(), bodyFont));
        if (proposal.getCustomerPhone() != null) billTo.addElement(new Paragraph("MOB NO.: " + proposal.getCustomerPhone(), bodyFont));
        table.addCell(billTo);

        // SHIP TO
        PdfPCell shipTo = new PdfPCell();
        shipTo.setBorder(Rectangle.NO_BORDER);
        shipTo.addElement(new Paragraph("SHIP TO:", headFont));
        shipTo.addElement(new Paragraph(proposal.getCustomerName(), headFont)); // Default to same customer
        
        if (proposal.getShippingAddress() != null) {
             String addr = proposal.getShippingAddress().getStreet() + "\n" +
                           proposal.getShippingAddress().getCity() + ", " + proposal.getShippingAddress().getState() + "\n" +
                           proposal.getShippingAddress().getCountry() + " - " + proposal.getShippingAddress().getPostalCode();
             shipTo.addElement(new Paragraph(addr, bodyFont));
        } else if (proposal.getBillingAddress() != null) {
             // Fallback to billing
             String addr = proposal.getBillingAddress().getStreet() + "\n" +
                           proposal.getBillingAddress().getCity() + ", " + proposal.getBillingAddress().getState() + "\n" +
                           proposal.getBillingAddress().getCountry() + " - " + proposal.getBillingAddress().getPostalCode();
             shipTo.addElement(new Paragraph(addr, bodyFont));
        }
        table.addCell(shipTo);

        document.add(table);
        document.add(Chunk.NEWLINE);
    }

    private void addLineItems(Document document, Proposal proposal) throws DocumentException {
        boolean hasLineItemDiscount = proposal.getLineItems().stream()
                .anyMatch(item -> item.getLineDiscountAmount() != null && item.getLineDiscountAmount().compareTo(BigDecimal.ZERO) > 0);

        int numCols = hasLineItemDiscount ? 8 : 7;
        PdfPTable table = new PdfPTable(numCols);
        table.setWidthPercentage(100);
        if (hasLineItemDiscount) {
            table.setWidths(new float[]{0.5f, 2.5f, 1f, 0.6f, 0.6f, 1.2f, 1.2f, 1.2f});
        } else {
            table.setWidths(new float[]{0.5f, 3f, 1f, 0.6f, 0.6f, 1.2f, 1.2f});
        }
        table.setHeaderRows(1);

        // Header Styling
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8);
        String[] headers = hasLineItemDiscount 
            ? new String[]{"SR NO", "DESCRIPTION", "HSN/SAC", "QTY", "UNIT", "RATE", "DISCOUNT", "AMOUNT"}
            : new String[]{"SR NO", "DESCRIPTION", "HSN/SAC", "QTY", "UNIT", "RATE", "AMOUNT"};
        
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
            
            // Quantity & Unit
            addCell(table, String.valueOf(item.getQuantity()), Element.ALIGN_CENTER, cellFont);
            addCell(table, (item.getUnit() != null ? item.getUnit() : "-"), Element.ALIGN_CENTER, cellFont);
            addCell(table, currency.format(item.getUnitPrice()), Element.ALIGN_RIGHT, cellFont);
            
            if (hasLineItemDiscount) {
                if (item.getLineDiscountAmount() != null && item.getLineDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
                    addCell(table, currency.format(item.getLineDiscountAmount()), Element.ALIGN_RIGHT, cellFont);
                } else {
                    addCell(table, "-", Element.ALIGN_CENTER, cellFont);
                }
            }
            
            BigDecimal amount = item.getLineSubtotal();
            if (hasLineItemDiscount && item.getLineDiscountAmount() != null) {
                amount = amount.subtract(item.getLineDiscountAmount());
            }
            addCell(table, currency.format(amount), Element.ALIGN_RIGHT, cellFont);
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
        // First, Totals Table (Full Width)
        PdfPTable mainTable = new PdfPTable(2);
        mainTable.setWidthPercentage(100);
        mainTable.setWidths(new float[]{1.5f, 1f});
        mainTable.setSpacingBefore(10);

        // Right Side: Totals
        PdfPTable totalsTable = new PdfPTable(2);
        totalsTable.setWidthPercentage(100);
        
        Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 8);

        addTotalRow(totalsTable, "SUBTOTAL:", proposal.getSubtotal(), boldFont);
        if (proposal.getDiscountAmount() != null && proposal.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            addTotalRow(totalsTable, "DISCOUNT:", proposal.getDiscountAmount(), boldFont);
            BigDecimal taxableAmount = proposal.getSubtotal().subtract(proposal.getDiscountAmount());
            addTotalRow(totalsTable, "TAXABLE AMOUNT:", taxableAmount, boldFont);
        } else {
            addTotalRow(totalsTable, "TAXABLE AMOUNT:", proposal.getSubtotal(), boldFont);
        }

        if (proposal.getTaxAmount() != null && proposal.getTaxAmount().compareTo(BigDecimal.ZERO) > 0) {
            if (proposal.getGstType() == com.ultron.backend.domain.enums.GstType.IGST) {
                addTotalRow(totalsTable, "TOTAL IGST (18%):", proposal.getTaxAmount(), boldFont);
            } else if (proposal.getGstType() == com.ultron.backend.domain.enums.GstType.CGST_SGST) {
                BigDecimal halfTax = proposal.getTaxAmount().divide(new BigDecimal("2"), 2, java.math.RoundingMode.HALF_UP);
                addTotalRow(totalsTable, "TOTAL CGST (9%):", halfTax, boldFont);
                addTotalRow(totalsTable, "TOTAL SGST (9%):", halfTax, boldFont);
            } else {
                addTotalRow(totalsTable, "TOTAL GST:", proposal.getTaxAmount(), boldFont);
            }
        }
        addTotalRow(totalsTable, "TOTAL AMOUNT:", proposal.getTotalAmount(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10));

        if (proposal.getPaymentMilestones() != null && !proposal.getPaymentMilestones().isEmpty() && proposal.getCurrentMilestoneIndex() != null) {
            int currentIndex = proposal.getCurrentMilestoneIndex();
            
            if (currentIndex > 0) {
                BigDecimal previousPercentage = BigDecimal.ZERO;
                for (int i = 0; i < currentIndex; i++) {
                    if (i < proposal.getPaymentMilestones().size()) {
                        previousPercentage = previousPercentage.add(proposal.getPaymentMilestones().get(i).getPercentage());
                    }
                }
                
                BigDecimal previousAmount = proposal.getTotalAmount().multiply(previousPercentage).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
                addTotalRow(totalsTable, "LESS: RECEIVED (" + previousPercentage.stripTrailingZeros().toPlainString() + "%):", previousAmount, boldFont);
            }
            
            if (currentIndex < proposal.getPaymentMilestones().size()) {
                Proposal.PaymentMilestone currentMilestone = proposal.getPaymentMilestones().get(currentIndex);
                BigDecimal payableAmount = proposal.getTotalAmount().multiply(currentMilestone.getPercentage()).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
                String milestoneLabel = currentMilestone.getName() != null ? currentMilestone.getName() : "Milestone " + (currentIndex + 1);
                addTotalRow(totalsTable, "PAYABLE (" + milestoneLabel + " " + currentMilestone.getPercentage().stripTrailingZeros().toPlainString() + "%):", payableAmount, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10));
            } else {
                 addTotalRow(totalsTable, "PAYABLE VALUE:", proposal.getTotalAmount(), boldFont);
            }
        } else {
            addTotalRow(totalsTable, "PAYABLE VALUE:", proposal.getTotalAmount(), boldFont);
        }

        PdfPCell emptyCell = new PdfPCell();
        emptyCell.setBorder(Rectangle.NO_BORDER);
        mainTable.addCell(emptyCell);
        
        PdfPCell totalsCell = new PdfPCell(totalsTable);
        totalsCell.setBorder(Rectangle.NO_BORDER);
        mainTable.addCell(totalsCell);
        document.add(mainTable);

        // Second: Bank Details & Terms (Side by Side)
        document.add(new Paragraph(" "));
        PdfPTable bottomTable = new PdfPTable(2);
        bottomTable.setWidthPercentage(100);
        bottomTable.setWidths(new float[]{1.2f, 1f});

        // Left Side: Terms
        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(Rectangle.NO_BORDER);
        leftCell.addElement(new Paragraph("TERMS & CONDITIONS", boldFont));
        String terms = (config != null && config.getTermsAndConditions() != null) ? config.getTermsAndConditions() : "1. Validity: Offer Valid Only for 1 Days\n2. Delivery: 1-2 Weeks";
        leftCell.addElement(new Paragraph(terms, normalFont));
        bottomTable.addCell(leftCell);

        // Right Side: Bank Details
        PdfPCell bankCell = new PdfPCell();
        bankCell.setBorder(Rectangle.NO_BORDER);
        bankCell.addElement(new Paragraph("OUR BANK DETAILS", boldFont));
        if (config != null && config.getBankName() != null) {
            bankCell.addElement(new Paragraph("Bank Name: " + config.getBankName(), normalFont));
            bankCell.addElement(new Paragraph("Account Name: " + config.getAccountName(), normalFont));
            bankCell.addElement(new Paragraph("A/C No: " + config.getAccountNumber(), normalFont));
            bankCell.addElement(new Paragraph("IFSC: " + config.getIfscCode(), normalFont));
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
        document.add(new Paragraph(" "));
        
        PdfPTable footerTable = new PdfPTable(2);
        footerTable.setWidthPercentage(100);
        
        PdfPCell leftFooter = new PdfPCell();
        leftFooter.setBorder(Rectangle.NO_BORDER);
        
        if (config != null && config.getAuthorizedSignatorySealUrl() != null && !config.getAuthorizedSignatorySealUrl().isEmpty()) {
            try {
                Image seal = Image.getInstance(new java.net.URL(config.getAuthorizedSignatorySealUrl()));
                seal.scaleToFit(80, 80);
                leftFooter.addElement(seal);
            } catch (Exception e) {
                log.warn("Failed to load seal from URL: {}", config.getAuthorizedSignatorySealUrl());
            }
        }
        
        String signLabel = (config != null && config.getAuthorizedSignatoryLabel() != null) ? config.getAuthorizedSignatoryLabel() : "Authorized Signatory";
        leftFooter.addElement(new Paragraph(signLabel, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8)));
        footerTable.addCell(leftFooter);
        
        PdfPCell rightFooter = new PdfPCell();
        rightFooter.setBorder(Rectangle.NO_BORDER);
        // Empty right footer
        footerTable.addCell(rightFooter);
        
        document.add(footerTable);
        
        // Web/Email at bottom center
        String footerText = (config != null && config.getFooterText() != null) ? config.getFooterText() : "www.ultroncrm.com | info@ultroncrm.com";
        Paragraph footer = new Paragraph(footerText, FontFactory.getFont(FontFactory.HELVETICA, 7, Color.GRAY));
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.setSpacingBefore(15);
        document.add(footer);
    }
}
