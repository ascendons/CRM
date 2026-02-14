package com.ultron.backend.service;

import com.ultron.backend.domain.entity.Proposal;
import com.ultron.backend.domain.entity.ProposalVersion;
import com.ultron.backend.dto.response.ProposalVersionResponse;
import com.ultron.backend.repository.ProposalVersionRepository;
import com.ultron.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProposalVersioningService extends BaseTenantService {

    private final ProposalVersionRepository proposalVersionRepository;
    private final UserRepository userRepository;

    @Transactional
    public void createSnapshot(Proposal proposal, String action, String comment, String userId) {
        String tenantId = getCurrentTenantId();
        log.info("[Tenant: {}] Creating snapshot for proposal: {}, action: {}", tenantId, proposal.getProposalId(), action);

        // Find the latest version number
        Integer nextVersion = proposalVersionRepository.findFirstByProposalIdAndTenantIdOrderByVersionDesc(proposal.getId(), tenantId)
                .map(v -> v.getVersion() + 1)
                .orElse(1);

        ProposalVersion version = ProposalVersion.builder()
                .proposalId(proposal.getId())
                .tenantId(tenantId)
                .version(nextVersion)
                .snapshot(proposal) // Mongo will store the full object snapshot
                .action(action)
                .comment(comment)
                .createdAt(LocalDateTime.now())
                .createdBy(userId)
                .createdByName(getUserName(userId))
                .build();

        proposalVersionRepository.save(version);
    }

    public List<ProposalVersionResponse> getVersionHistory(String proposalId) {
        String tenantId = getCurrentTenantId();
        return proposalVersionRepository.findByProposalIdAndTenantIdOrderByVersionDesc(proposalId, tenantId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ProposalVersionResponse getVersion(String proposalId, Integer version) {
        String tenantId = getCurrentTenantId();
        return proposalVersionRepository.findByProposalIdAndVersionAndTenantId(proposalId, version, tenantId)
                .map(this::mapToResponse)
                .orElseThrow(() -> new RuntimeException("Proposal version " + version + " not found"));
    }

    private String getUserName(String userId) {
        return userRepository.findById(userId)
                .map(user -> {
                    if (user.getProfile() != null && user.getProfile().getFullName() != null) {
                        return user.getProfile().getFullName();
                    }
                    return user.getUsername();
                })
                .orElse("Unknown");
    }

    private ProposalVersionResponse mapToResponse(ProposalVersion version) {
        return ProposalVersionResponse.builder()
                .id(version.getId())
                .proposalId(version.getProposalId())
                .version(version.getVersion())
                .action(version.getAction())
                .comment(version.getComment())
                .snapshot(version.getSnapshot())
                .createdAt(version.getCreatedAt())
                .createdBy(version.getCreatedBy())
                .createdByName(version.getCreatedByName())
                .build();
    }
}
