package org.constructx.policyhub.policies.api.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.constructx.policyhub.policies.domain.PolicyCategory;

import java.util.List;

public record UpdatePolicyRequest(
        @NotBlank
        @Size(max = 200)
        String policyId,

        @NotNull
        PolicyCategory category,

        @NotNull
        List<JsonNode> constraints,

        @NotBlank
        String legalText
) {
}