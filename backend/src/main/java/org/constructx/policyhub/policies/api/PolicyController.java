package org.constructx.policyhub.policies.api;

import jakarta.validation.Valid;
import org.constructx.policyhub.policies.api.dto.CreatePolicyRequest;
import org.constructx.policyhub.policies.api.dto.PolicyResponse;
import org.constructx.policyhub.policies.api.dto.UpdatePolicyRequest;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlPolicyDefinitionResponse;
import org.constructx.policyhub.policies.application.PolicyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;

import java.util.List;
import java.util.UUID;

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

    @Operation(description = "Get the ODRL representation of a Policy.",
        responses = {
            @ApiResponse(responseCode = "200", description = "The ODRL representation of the Policy with the given ID"),
            @ApiResponse(responseCode = "404", description = "The Policy with the given ID was not found", content = @Content)
        })
    @GetMapping("/{id}/odrl")
    public ResponseEntity<OdrlPolicyDefinitionResponse> getOdrlPolicyDefinitionById(
        @Parameter(
            description = "UUID of the Policy to retrieve",
            example = "00000000-0000-0000-0000-000000000001"
        )
        @PathVariable UUID id
    ) {
        return ResponseEntity.ok(policyService.getOdrlPolicyDefinitionById(id));
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePolicy(
            @PathVariable UUID id
    ) {
        policyService.deletePolicy(id);
        return ResponseEntity.noContent().build();
    }
}
