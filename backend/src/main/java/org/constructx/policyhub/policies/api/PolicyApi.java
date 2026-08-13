package org.constructx.policyhub.policies.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.constructx.policyhub.policies.api.dto.CreatePolicyRequest;
import org.constructx.policyhub.policies.api.dto.PolicyResponse;
import org.constructx.policyhub.policies.api.dto.UpdatePolicyRequest;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlPolicyDefinitionResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

@Tag(
        name = "Policies",
        description = "Create, retrieve, update and delete Policy Hub policies"
)
public interface PolicyApi {

    @Operation(
            summary = "Get policies",
            description = "Returns stored policies using pagination."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Policies returned successfully"
    )
    @GetMapping
    ResponseEntity<Page<PolicyResponse>> getAllPolicies(
            @ParameterObject Pageable pageable
    );

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
    ResponseEntity<PolicyResponse> getPolicyById(
            @Parameter(
                    description = "UUID of the policy to retrieve",
                    example = "00000000-0000-0000-0000-000000000001"
            )
            @PathVariable UUID id
    );

    @Operation(
            summary = "Get a policy as ODRL",
            description = "Returns the ODRL representation of a policy."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "ODRL representation returned successfully"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Policy not found",
                    content = @Content
            )
    })
    @GetMapping("/{id}/odrl")
    ResponseEntity<OdrlPolicyDefinitionResponse> getOdrlPolicyDefinitionById(
            @Parameter(
                    description = "UUID of the policy to retrieve",
                    example = "00000000-0000-0000-0000-000000000001"
            )
            @PathVariable UUID id
    );

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
    ResponseEntity<PolicyResponse> createPolicy(
            @Valid @RequestBody CreatePolicyRequest request
    );

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
    ResponseEntity<PolicyResponse> updatePolicy(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePolicyRequest request
    );

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
    ResponseEntity<Void> deletePolicy(
            @PathVariable UUID id
    );
}