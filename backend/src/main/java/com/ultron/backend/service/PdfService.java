package com.ultron.backend.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.ultron.backend.domain.entity.Proposal;
import com.ultron.backend.domain.entity.Product;
import com.ultron.backend.domain.enums.DiscountType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@Slf4j
@RequiredArgsConstructor
public class PdfService {

    private final ProductService productService;

    public byte[] generateProposalPdf(Proposal proposal) throws IOException {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, out);

            document.open();

            addHeader(document, proposal);
            addCustomerDetails(document, proposal);
            addLineItems(document, proposal);
            addTotals(document, proposal);
            addTermsAndNotes(document, proposal);
            addFooter(document);

            document.close();
            return out.toByteArray();
        }
    }

    private void addHeader(Document document, Proposal proposal) throws DocumentException {
        // Title
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24, Color.BLACK);
        Paragraph title = new Paragraph("PROPOSAL / INVOICE", titleFont);
        title.setAlignment(Element.ALIGN_RIGHT);
        document.add(title);

        document.add(Chunk.NEWLINE);

        // Company Info (Left) & Invoice Info (Right)
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{1, 1});

        // Company Info
        Font companyFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
        
        PdfPCell companyCell = new PdfPCell();
        companyCell.setBorder(Rectangle.NO_BORDER);
        companyCell.addElement(new Paragraph("Ultron CRM Inc.", companyFont));
        companyCell.addElement(new Paragraph("123 Tech Park, Innovation Way", normalFont));
        companyCell.addElement(new Paragraph("Silicon Valley, CA 94025", normalFont));
        companyCell.addElement(new Paragraph("contact@ultroncrm.com", normalFont));
        headerTable.addCell(companyCell);

        // Invoice Info
        PdfPCell invoiceCell = new PdfPCell();
        invoiceCell.setBorder(Rectangle.NO_BORDER);
        invoiceCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        
        Paragraph pNumber = new Paragraph("Proposal #: " + proposal.getProposalNumber(), companyFont);
        pNumber.setAlignment(Element.ALIGN_RIGHT);
        invoiceCell.addElement(pNumber);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy");
        
        Paragraph pDate = new Paragraph("Date: " + proposal.getCreatedAt().format(formatter), normalFont);
        pDate.setAlignment(Element.ALIGN_RIGHT);
        invoiceCell.addElement(pDate);

        Paragraph pValid = new Paragraph("Valid Until: " + proposal.getValidUntil().format(formatter), normalFont);
        pValid.setAlignment(Element.ALIGN_RIGHT);
        invoiceCell.addElement(pValid);
        
        headerTable.addCell(invoiceCell);

        document.add(headerTable);
        document.add(Chunk.NEWLINE);
        document.add(Chunk.NEWLINE);
    }

    private void addCustomerDetails(Document document, Proposal proposal) throws DocumentException {
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.GRAY);
        Font contentFont = FontFactory.getFont(FontFactory.HELVETICA, 10);

        Paragraph billTo = new Paragraph("BILL TO:", headerFont);
        document.add(billTo);

        if (proposal.getCustomerName() != null) {
            document.add(new Paragraph(proposal.getCustomerName(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11)));
        }
        
        if (proposal.getCustomerEmail() != null) {
            document.add(new Paragraph(proposal.getCustomerEmail(), contentFont));
        }
        
        if (proposal.getCustomerPhone() != null) {
            document.add(new Paragraph(proposal.getCustomerPhone(), contentFont));
        }

        document.add(Chunk.NEWLINE);
        document.add(Chunk.NEWLINE);
    }

    private void addLineItems(Document document, Proposal proposal) throws DocumentException {
        PdfPTable table = new PdfPTable(6); // Item, Qty, Price, Disc, Tax, Total
        table.setWidthPercentage(100);
        table.setWidths(new float[]{4, 1, 1.5f, 1.5f, 1.5f, 1.5f});
        table.setHeaderRows(1);
        table.setSpacingBefore(10f);
        table.setSpacingAfter(10f);

        // Headers
        String[] headers = {"Item & Description", "Qty", "Unit Price", "Discount", "Tax", "Total"};
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
        
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
            cell.setBackgroundColor(Color.DARK_GRAY);
            cell.setPadding(5);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(cell);
        }

        // Data
        Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
        Font descFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.GRAY);
        NumberFormat currency = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));

        for (Proposal.ProposalLineItem item : proposal.getLineItems()) {
            // Item & Disc
            PdfPCell itemCell = new PdfPCell();
            itemCell.setPadding(5);
            itemCell.addElement(new Paragraph(item.getProductName(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
            if (item.getDescription() != null && !item.getDescription().isEmpty()) {
                itemCell.addElement(new Paragraph(item.getDescription(), descFont));
            }
            table.addCell(itemCell);

            // Qty
            PdfPCell qtyCell = new PdfPCell(new Phrase(String.valueOf(item.getQuantity()), cellFont));
            qtyCell.setPadding(5);
            qtyCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            qtyCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            table.addCell(qtyCell);

            // Price
            PdfPCell priceCell = new PdfPCell(new Phrase(currency.format(item.getUnitPrice()), cellFont));
            priceCell.setPadding(5);
            priceCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            priceCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            table.addCell(priceCell);

            // Discount
            String discountStr = "-";
            if (item.getDiscountValue() != null && item.getDiscountValue().compareTo(java.math.BigDecimal.ZERO) > 0) {
                if (item.getDiscountType() == DiscountType.PERCENTAGE) {
                    discountStr = item.getDiscountValue() + "%";
                } else {
                    discountStr = currency.format(item.getDiscountValue());
                }
            }
            PdfPCell discCell = new PdfPCell(new Phrase(discountStr, cellFont));
            discCell.setPadding(5);
            discCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            discCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            table.addCell(discCell);

            // Tax
            String taxStr = "-";
            if (item.getLineTaxAmount() != null && item.getLineTaxAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {
                 taxStr = currency.format(item.getLineTaxAmount());
            }
            PdfPCell taxCell = new PdfPCell(new Phrase(taxStr, cellFont));
            taxCell.setPadding(5);
            taxCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            taxCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            table.addCell(taxCell);

            // Total
            PdfPCell totalCell = new PdfPCell(new Phrase(currency.format(item.getLineTotal()), cellFont));
            totalCell.setPadding(5);
            totalCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            totalCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            table.addCell(totalCell);
        }

        document.add(table);
    }

    private void addTotals(Document document, Proposal proposal) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(40); // Only occupy right side
        table.setHorizontalAlignment(Element.ALIGN_RIGHT);
        
        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
        Font valueFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        NumberFormat currency = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));

        // Subtotal
        addTotalRow(table, "Subtotal:", currency.format(proposal.getSubtotal()), labelFont, valueFont);

        // Overall Discount
        if (proposal.getDiscountAmount() != null && proposal.getDiscountAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {
            Font discountFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.RED);
            addTotalRow(table, "Discount:", "-" + currency.format(proposal.getDiscountAmount()), labelFont, discountFont);
        }

        // Tax
        if (proposal.getTaxAmount() != null && proposal.getTaxAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {
            addTotalRow(table, "Tax:", currency.format(proposal.getTaxAmount()), labelFont, valueFont);
        }

        // Total
        Font totalLabelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
        Font totalValueFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.BLUE);
        addTotalRow(table, "Total:", currency.format(proposal.getTotalAmount()), totalLabelFont, totalValueFont);

        document.add(table);
        document.add(Chunk.NEWLINE);
    }

    private void addTotalRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        labelCell.setPadding(3);
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, valueFont));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        valueCell.setPadding(3);
        table.addCell(valueCell);
    }

    private void addTermsAndNotes(Document document, Proposal proposal) throws DocumentException {
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        Font contentFont = FontFactory.getFont(FontFactory.HELVETICA, 9);

        if (proposal.getPaymentTerms() != null && !proposal.getPaymentTerms().isEmpty()) {
            document.add(new Paragraph("Payment Terms:", headerFont));
            document.add(new Paragraph(proposal.getPaymentTerms(), contentFont));
            document.add(Chunk.NEWLINE);
        }

        if (proposal.getDeliveryTerms() != null && !proposal.getDeliveryTerms().isEmpty()) {
            document.add(new Paragraph("Delivery Terms:", headerFont));
            document.add(new Paragraph(proposal.getDeliveryTerms(), contentFont));
            document.add(Chunk.NEWLINE);
        }

        if (proposal.getNotes() != null && !proposal.getNotes().isEmpty()) {
            document.add(new Paragraph("Notes:", headerFont));
            document.add(new Paragraph(proposal.getNotes(), contentFont));
            document.add(Chunk.NEWLINE);
        }
    }

    private void addFooter(Document document) throws DocumentException {
        Paragraph footer = new Paragraph("Thank you for your business!", FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10, Color.GRAY));
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.setSpacingBefore(30);
        document.add(footer);
    }
}
