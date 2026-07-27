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
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;
import java.util.UUID;

@Tag(
        name = "Policies",
        description = "Create, retrieve, update and delete Policy Hub policies"
)
@RestController
@RequestMapping("/api/v1/policies")
public class PolicyController {

    private final PolicyService policyService;

    public PolicyController(PolicyService policyService) {
        this.policyService = policyService;
    }

    @Operation(
            summary = "Get all policies",
            description = "Returns all stored policies."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Policies returned successfully"
    )
    @GetMapping
    public ResponseEntity<List<PolicyResponse>> getAllPolicies() {
        return ResponseEntity.ok(policyService.getAllPolicies());
    }

    @Operation(
            summary = "Get a policy by ID",
            description = "Returns a single policy identified by its backend-generated UUID."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Policy returned successfully"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Policy not found"
            )
    })
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

    @Operation(
            summary = "Create a policy",
            description = "Creates and persistently stores a new policy."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Policy created successfully"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Policy request is incomplete or invalid"
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "A policy with the same policyId already exists"
            )
    })
    @PostMapping
    public ResponseEntity<PolicyResponse> createPolicy(
            @Valid @RequestBody CreatePolicyRequest request
    ) {
        PolicyResponse created = policyService.createPolicy(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(created);
    }

    @Operation(
            summary = "Update a policy",
            description = "Replaces the editable fields of an existing policy."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Policy updated successfully"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Policy request is incomplete or invalid"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Policy not found"
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "The requested policyId belongs to another policy"
            )
    })
    @PutMapping("/{id}")
    public ResponseEntity<PolicyResponse> updatePolicy(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePolicyRequest request
    ) {
        return ResponseEntity.ok(policyService.updatePolicy(id, request));
    }

    @Operation(
            summary = "Delete a policy",
            description = "Deletes an existing policy permanently."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "204",
                    description = "Policy deleted successfully"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Policy not found"
            )
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePolicy(
            @PathVariable UUID id
    ) {
        policyService.deletePolicy(id);
        return ResponseEntity.noContent().build();
    }
}
