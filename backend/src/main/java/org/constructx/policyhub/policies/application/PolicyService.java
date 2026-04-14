package org.constructx.policyhub.policies.application;

import org.constructx.policyhub.policies.api.dto.PolicyResponse;
import org.constructx.policyhub.policies.domain.Policy;
import org.constructx.policyhub.policies.infrastructure.PolicyMapper;
import org.constructx.policyhub.policies.infrastructure.PolicyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PolicyService {

    private static final Logger log = LoggerFactory.getLogger(PolicyService.class);

    private final PolicyRepository policyRepository;
    private final PolicyMapper policyMapper;

    public PolicyService(PolicyRepository policyRepository, PolicyMapper policyMapper) {
        this.policyRepository = policyRepository;
        this.policyMapper = policyMapper;
    }

    @Transactional(readOnly = true)
    public List<PolicyResponse> getAllPolicies() {
        log.info("Fetching all policies");
        return policyRepository.findAll().stream()
                .map(policyMapper::toDomain)
                .map(this::toResponse)
                .toList();
    }

    private PolicyResponse toResponse(Policy policy) {
        return new PolicyResponse(
                policy.id(),
                policy.name(),
                policy.description(),
                policy.status().name(),
                policy.content(),
                policy.createdAt(),
                policy.updatedAt()
        );
    }
}
