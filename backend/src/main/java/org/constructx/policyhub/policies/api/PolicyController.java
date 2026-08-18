package org.constructx.policyhub.policies.api;

import jakarta.validation.Valid;
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
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/policies")
@RequiredArgsConstructor
public class PolicyController implements PolicyApi {

    private final PolicyService policyService;

    @Override
    @GetMapping
    public ResponseEntity<Page<PolicyResponse>> getAllPolicies(
            Pageable pageable
    ) {
        return ResponseEntity.ok(
                policyService.getAllPolicies(pageable)
        );
    }

    @Override
    @GetMapping("/{id}")
    public ResponseEntity<PolicyResponse> getPolicyById(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(
                policyService.getPolicyById(id)
        );
    }

    @Override
    @GetMapping("/{id}/odrl")
    public ResponseEntity<OdrlPolicyDefinitionResponse> getOdrlPolicyDefinitionById(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(
                policyService.getOdrlPolicyDefinitionById(id)
        );
    }

    @Override
    @PostMapping
    public ResponseEntity<PolicyResponse> createPolicy(
            @Valid @RequestBody CreatePolicyRequest request
    ) {
        PolicyResponse created =
                policyService.createPolicy(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(created);
    }

    @Override
    @PutMapping("/{id}")
    public ResponseEntity<PolicyResponse> updatePolicy(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePolicyRequest request
    ) {
        return ResponseEntity.ok(
                policyService.updatePolicy(id, request)
        );
    }

    @Override
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePolicy(
            @PathVariable UUID id
    ) {
        policyService.deletePolicy(id);
        return ResponseEntity.noContent().build();
    }
}