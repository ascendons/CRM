package com.ultron.backend.service;

import com.ultron.backend.domain.entity.SignatureRequest;
import com.ultron.backend.domain.enums.SignatureStatus;
import com.ultron.backend.repository.SignatureRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ESignatureService extends BaseTenantService {

    private final SignatureRequestRepository signatureRequestRepository;

    public SignatureRequest createRequest(String documentType, String documentId,
                                          String signerEmail, String signerName) {
        String tenantId = getCurrentTenantId();
        String token = UUID.randomUUID().toString();
        SignatureRequest request = SignatureRequest.builder()
                .requestId("SIG-" + System.currentTimeMillis())
                .tenantId(tenantId)
                .documentType(documentType)
                .documentId(documentId)
                .signerEmail(signerEmail)
                .signerName(signerName)
                .token(token)
                .status(SignatureStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .createdBy(getCurrentUserId())
                .updatedAt(LocalDateTime.now())
                .updatedBy(getCurrentUserId())
                .build();
        log.info("Created signature request for document {} signer {}", documentId, signerEmail);
        return signatureRequestRepository.save(request);
    }

    public SignatureRequest getByToken(String token) {
        return signatureRequestRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Signature request not found"));
    }

    public SignatureRequest submitSignature(String token, String signatureBase64, String ipAddress) {
        SignatureRequest req = getByToken(token);
        if (req.getStatus() != SignatureStatus.PENDING) {
            throw new RuntimeException("Signature request is no longer pending");
        }
        if (req.getExpiresAt().isBefore(LocalDateTime.now())) {
            req.setStatus(SignatureStatus.EXPIRED);
            signatureRequestRepository.save(req);
            throw new RuntimeException("Signature request has expired");
        }
        req.setSignatureImageBase64(signatureBase64);
        req.setSignedAt(LocalDateTime.now());
        req.setIpAddress(ipAddress);
        req.setStatus(SignatureStatus.SIGNED);
        req.setUpdatedAt(LocalDateTime.now());
        return signatureRequestRepository.save(req);
    }

    public SignatureRequest declineSignature(String token) {
        SignatureRequest req = getByToken(token);
        req.setStatus(SignatureStatus.DECLINED);
        req.setUpdatedAt(LocalDateTime.now());
        return signatureRequestRepository.save(req);
    }

    public List<SignatureRequest> getByDocumentId(String documentId) {
        String tenantId = getCurrentTenantId();
        return signatureRequestRepository.findByTenantIdAndDocumentId(tenantId, documentId);
    }

    public List<SignatureRequest> getAll() {
        String tenantId = getCurrentTenantId();
        return signatureRequestRepository.findByTenantIdAndIsDeletedFalse(tenantId);
    }
}
