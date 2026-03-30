package org.constructx.policyhub.policies.application;

import org.constructx.policyhub.policies.api.dto.PolicyResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PolicyService {

    private static final Logger log = LoggerFactory.getLogger(PolicyService.class);

    public List<PolicyResponse> getAllPolicies() {
        log.info("Fetching all policies");
        return List.of(
                new PolicyResponse("skeleton-1", "Example Policy", "DRAFT")
        );
    }
}
