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

    // Method removed. ProposalService handles fetching and calls generateProposalPdf(Proposal)

    public byte[] generateProposalPdf(Proposal proposal) throws IOException {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, out);

            document.open();

            addHeader(document, proposal);
            addBillToShipTo(document, proposal);
            addLineItems(document, proposal);
            addTotalsAndBankDetails(document, proposal);
            addFooter(document);

            document.close();
            return out.toByteArray();
        }
    }

    private void addHeader(Document document, Proposal proposal) throws DocumentException {
        // Logo and Company Details (Top Left)
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{3, 1});

        // Left: Company Logo & Address
        PdfPCell companyCell = new PdfPCell();
        companyCell.setBorder(Rectangle.NO_BORDER);
        
        // Title: Company Name
        Font companyNameFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, new Color(0, 51, 102));
        Paragraph companyName = new Paragraph("Wattglow Power Pvt Ltd", companyNameFont); // Placeholder/Hardcoded for now as per image or fetch from Tenant? User said "whatever is being created same i wan to be there".
        // Use Tenant info if available, else generic or placeholders. 
        // User said "you can try creating one proposal and whatever is being created same i wan to be there".
        // So I should use the data from the proposal/organization. 
        // Since I don't have Org data passed in, I'll use placeholders that look professional or "Your Company Name".
        // Actually, the image has "Wattglow Power". I will use "Ultron CRM Inc." as default.
        
        companyCell.addElement(new Paragraph("Ultron CRM Inc.", companyNameFont));
        
        Font addressFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
        companyCell.addElement(new Paragraph("123 Tech Park, Innovation Way", addressFont));
        companyCell.addElement(new Paragraph("Silicon Valley, CA 94025", addressFont));
        companyCell.addElement(new Paragraph("Email: contact@ultroncrm.com | Web: www.ultroncrm.com", addressFont));
        
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
        document.add(Chunk.NEWLINE);
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
        document.add(Chunk.NEWLINE);
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
        PdfPTable table = new PdfPTable(5); // Sr No, Description, Qty, Rate, Amount
        table.setWidthPercentage(100);
        table.setWidths(new float[]{0.5f, 4f, 1f, 1.5f, 1.5f});
        table.setHeaderRows(1);

        // Header Styling
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
        String[] headers = {"SR NO", "DESCRIPTION", "QTY", "RATE", "AMOUNT"};
        
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            cell.setPadding(5);
            cell.setBackgroundColor(new Color(240, 240, 240));
            table.addCell(cell);
        }

        // Data
        Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
        NumberFormat currency = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));
        int srNo = 1;

        for (Proposal.ProposalLineItem item : proposal.getLineItems()) {
            addCell(table, String.valueOf(srNo++), Element.ALIGN_CENTER, cellFont);
            
            // Description & HSN
            String desc = item.getProductName();
            if (item.getDescription() != null && !item.getDescription().isEmpty()) {
                desc += "\n" + item.getDescription();
            }
            addCell(table, desc, Element.ALIGN_LEFT, cellFont);
            
            addCell(table, String.valueOf(item.getQuantity()) + " " + (item.getUnit() != null ? item.getUnit() : ""), Element.ALIGN_CENTER, cellFont);
            addCell(table, currency.format(item.getUnitPrice()), Element.ALIGN_RIGHT, cellFont);
            addCell(table, currency.format(item.getLineSubtotal()), Element.ALIGN_RIGHT, cellFont);
            // Using LineSubtotal (Qty * Rate) as Amount, tax/discount handled at bottom
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

    private void addTotalsAndBankDetails(Document document, Proposal proposal) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1.5f, 1f});

        // Left Side: Bank Details & Terms
        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(Rectangle.NO_BORDER);
        
        Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 9);

        leftCell.addElement(new Paragraph("TERMS & CONDITIONS", boldFont));
        if (proposal.getPaymentTerms() != null) leftCell.addElement(new Paragraph("Payment: " + proposal.getPaymentTerms(), normalFont));
        if (proposal.getDeliveryTerms() != null) leftCell.addElement(new Paragraph("Delivery: " + proposal.getDeliveryTerms(), normalFont));
        leftCell.addElement(new Paragraph("Validity: " + (proposal.getValidUntil() != null ? proposal.getValidUntil().toString() : "N/A"), normalFont));
        
        leftCell.addElement(Chunk.NEWLINE);
        leftCell.addElement(new Paragraph("OUR BANK DETAILS", boldFont));
        leftCell.addElement(new Paragraph("Bank Name: HDFC Bank", normalFont));
        leftCell.addElement(new Paragraph("Account Details: 50200092268897", normalFont));
        leftCell.addElement(new Paragraph("Branch & IFSC: HDFC0000167", normalFont));
        
        table.addCell(leftCell);

        // Right Side: Totals
        PdfPTable totalsTable = new PdfPTable(2);
        totalsTable.setWidthPercentage(100);
        
        addTotalRow(totalsTable, "TAXABLE AMOUNT:", proposal.getSubtotal(), boldFont);
        
        // Discount
        if (proposal.getDiscountAmount() != null && proposal.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            addTotalRow(totalsTable, "DISCOUNT:", proposal.getDiscountAmount().negate(), normalFont);
        }

        // Tax
        if (proposal.getTaxAmount() != null && proposal.getTaxAmount().compareTo(BigDecimal.ZERO) > 0) {
             addTotalRow(totalsTable, "TOTAL GST:", proposal.getTaxAmount(), boldFont);
        }

        // Grand Total
        addTotalRow(totalsTable, "TOTAL AMOUNT:", proposal.getTotalAmount(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11));

        PdfPCell rightCell = new PdfPCell(totalsTable);
        rightCell.setBorder(Rectangle.NO_BORDER);
        table.addCell(rightCell);

        document.add(table);
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

    private void addFooter(Document document) throws DocumentException {
        document.add(Chunk.NEWLINE);
        document.add(Chunk.NEWLINE);
        
        Paragraph p = new Paragraph("Authorized Signatory", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9));
        p.setAlignment(Element.ALIGN_LEFT);
        document.add(p);
        
        // Watermark/Footer text
        Paragraph footer = new Paragraph("This is a computer generated document.", FontFactory.getFont(FontFactory.HELVETICA, 8, Color.GRAY));
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.setSpacingBefore(20);
        document.add(footer);
    }
}
