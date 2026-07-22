package org.constructx.policyhub.policies.api.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.constructx.policyhub.policies.domain.PolicyCategory;

import java.util.List;

public record CreatePolicyRequest(
        @NotBlank(message = "policyId must not be blank")
        @Size(max = 200, message = "policyId must not exceed 200 characters")
        String policyId,

        @NotNull(message = "category is required")
        PolicyCategory category,

        @NotNull(message = "constraints are required")
        List<JsonNode> constraints,

        @NotBlank(message = "legalText must not be blank")
        String legalText
) {
}