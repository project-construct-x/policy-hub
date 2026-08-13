package org.constructx.policyhub.policies.api;

import lombok.RequiredArgsConstructor;
import org.constructx.policyhub.policies.api.dto.CreatePolicyRequest;
import org.constructx.policyhub.policies.api.dto.PolicyResponse;
import org.constructx.policyhub.policies.api.dto.UpdatePolicyRequest;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlPolicyDefinitionResponse;
import org.constructx.policyhub.policies.application.PolicyService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/policies")
public class PolicyController implements PolicyApi {

    private final PolicyService policyService;

    @Override
    public ResponseEntity<Page<PolicyResponse>> getAllPolicies(
            Pageable pageable
    ) {
        return ResponseEntity.ok(
                policyService.getAllPolicies(pageable)
        );
    }

    @Override
    public ResponseEntity<PolicyResponse> getPolicyById(UUID id) {
        return ResponseEntity.ok(policyService.getPolicyById(id));
    }

    @Override
    public ResponseEntity<OdrlPolicyDefinitionResponse> getOdrlPolicyDefinitionById(
            UUID id
    ) {
        return ResponseEntity.ok(
                policyService.getOdrlPolicyDefinitionById(id)
        );
    }

    @Override
    public ResponseEntity<PolicyResponse> createPolicy(
            CreatePolicyRequest request
    ) {
        PolicyResponse created =
                policyService.createPolicy(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(created);
    }

    @Override
    public ResponseEntity<PolicyResponse> updatePolicy(
            UUID id,
            UpdatePolicyRequest request
    ) {
        return ResponseEntity.ok(
                policyService.updatePolicy(id, request)
        );
    }

    @Override
    public ResponseEntity<Void> deletePolicy(UUID id) {
        policyService.deletePolicy(id);
        return ResponseEntity.noContent().build();
    }
}