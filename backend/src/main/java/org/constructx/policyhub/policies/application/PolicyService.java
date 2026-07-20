package org.constructx.policyhub.policies.application;

import org.constructx.policyhub.policies.api.dto.CreatePolicyRequest;
import org.constructx.policyhub.policies.api.dto.PolicyResponse;
import org.constructx.policyhub.policies.api.dto.UpdatePolicyRequest;
import org.constructx.policyhub.policies.domain.Policy;
import org.constructx.policyhub.policies.infrastructure.PolicyEntity;
import org.constructx.policyhub.policies.infrastructure.PolicyMapper;
import org.constructx.policyhub.policies.infrastructure.PolicyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class PolicyService {

    private static final Logger log = LoggerFactory.getLogger(PolicyService.class);

    private final PolicyRepository policyRepository;
    private final PolicyMapper policyMapper;

    public PolicyService(
            PolicyRepository policyRepository,
            PolicyMapper policyMapper
    ) {
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

    @Transactional(readOnly = true)
    public PolicyResponse getPolicyById(UUID id) {
        log.info("Fetching policy with id {}", id);

        PolicyEntity entity = policyRepository.findById(id)
                .orElseThrow(() -> new PolicyNotFoundException(id));

        return toResponse(policyMapper.toDomain(entity));
    }

    @Transactional
    public PolicyResponse createPolicy(CreatePolicyRequest request) {
        log.info("Creating policy with policyId {}", request.policyId());

        Policy policy = new Policy(
                null,
                request.policyId(),
                request.category(),
                request.constraints(),
                request.legalText(),
                null,
                null
        );

        PolicyEntity savedEntity = policyRepository.save(
                policyMapper.toEntity(policy)
        );

        return toResponse(policyMapper.toDomain(savedEntity));
    }

    @Transactional
    public PolicyResponse updatePolicy(
            UUID id,
            UpdatePolicyRequest request
    ) {
        log.info("Updating policy with id {}", id);

        PolicyEntity entity = policyRepository.findById(id)
                .orElseThrow(() -> new PolicyNotFoundException(id));

        policyMapper.updateEntity(request, entity);

        PolicyEntity savedEntity = policyRepository.save(entity);

        return toResponse(policyMapper.toDomain(savedEntity));
    }

    @Transactional
    public void deletePolicy(UUID id) {
        log.info("Deleting policy with id {}", id);

        PolicyEntity entity = policyRepository.findById(id)
                .orElseThrow(() -> new PolicyNotFoundException(id));

        policyRepository.delete(entity);
    }

    private PolicyResponse toResponse(Policy policy) {
        return new PolicyResponse(
                policy.id(),
                policy.policyId(),
                policy.category(),
                policy.constraints(),
                policy.legalText(),
                policy.createdAt(),
                policy.updatedAt()
        );
    }
}