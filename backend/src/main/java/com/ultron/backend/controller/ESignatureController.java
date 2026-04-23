package com.ultron.backend.controller;

import com.ultron.backend.domain.entity.SignatureRequest;
import com.ultron.backend.dto.response.ApiResponse;
import com.ultron.backend.service.ESignatureService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/esignature")
@RequiredArgsConstructor
public class ESignatureController {

    private final ESignatureService eSignatureService;

    @PostMapping("/requests")
    @PreAuthorize("hasPermission('ESIGNATURE', 'CREATE')")
    public ResponseEntity<ApiResponse<SignatureRequest>> createRequest(@RequestBody Map<String, String> body) {
        SignatureRequest req = eSignatureService.createRequest(
                body.get("documentType"), body.get("documentId"),
                body.get("signerEmail"), body.get("signerName"));
        return ResponseEntity.ok(ApiResponse.<SignatureRequest>builder()
                .success(true).message("Signature request created").data(req).build());
    }

    @GetMapping("/requests")
    @PreAuthorize("hasPermission('ESIGNATURE', 'VIEW')")
    public ResponseEntity<ApiResponse<List<SignatureRequest>>> getAll(
            @RequestParam(required = false) String documentId) {
        List<SignatureRequest> list = documentId != null
                ? eSignatureService.getByDocumentId(documentId)
                : eSignatureService.getAll();
        return ResponseEntity.ok(ApiResponse.<List<SignatureRequest>>builder()
                .success(true).data(list).build());
    }

    @GetMapping("/sign/{token}")
    public ResponseEntity<ApiResponse<SignatureRequest>> getByToken(@PathVariable String token) {
        return ResponseEntity.ok(ApiResponse.<SignatureRequest>builder()
                .success(true).data(eSignatureService.getByToken(token)).build());
    }

    @PostMapping("/sign/{token}")
    public ResponseEntity<ApiResponse<SignatureRequest>> submitSignature(
            @PathVariable String token,
            @RequestBody Map<String, String> body,
            HttpServletRequest httpRequest) {
        String ip = httpRequest.getRemoteAddr();
        SignatureRequest req = eSignatureService.submitSignature(token, body.get("signatureImageBase64"), ip);
        return ResponseEntity.ok(ApiResponse.<SignatureRequest>builder()
                .success(true).message("Signature submitted successfully").data(req).build());
    }

    @PostMapping("/sign/{token}/decline")
    public ResponseEntity<ApiResponse<SignatureRequest>> declineSignature(@PathVariable String token) {
        return ResponseEntity.ok(ApiResponse.<SignatureRequest>builder()
                .success(true).data(eSignatureService.declineSignature(token)).build());
    }
}
