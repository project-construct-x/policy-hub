package org.constructx.policyhub.policies.api;

import org.constructx.policyhub.policies.api.dto.PolicyResponse;
import org.constructx.policyhub.policies.application.PolicyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/policies")
public class PolicyController {

    private final PolicyService policyService;

    public PolicyController(PolicyService policyService) {
        this.policyService = policyService;
    }

    @GetMapping
    public ResponseEntity<List<PolicyResponse>> getAllPolicies() {
        return ResponseEntity.ok(policyService.getAllPolicies());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PolicyResponse> getPolicyById(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(policyService.getPolicyById(id));
    }

    @PostMapping
    public ResponseEntity<PolicyResponse> createPolicy(
            @Valid @RequestBody CreatePolicyRequest request
    ) {
        PolicyResponse created = policyService.createPolicy(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PolicyResponse> updatePolicy(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePolicyRequest request
    ) {
        return ResponseEntity.ok(policyService.updatePolicy(id, request));
    }
}
