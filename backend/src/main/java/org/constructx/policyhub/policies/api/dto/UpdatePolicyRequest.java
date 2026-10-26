package org.constructx.policyhub.policies.api.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.constructx.policyhub.policies.domain.LogicalOperator;
import org.constructx.policyhub.policies.domain.PolicyCategory;
import org.constructx.policyhub.policies.domain.PolicyId;

import java.util.List;

public record UpdatePolicyRequest(
        @NotBlank
        @Size(max = 200)
        @Pattern(regexp = PolicyId.PATTERN, message = PolicyId.PATTERN_MESSAGE)
        String policyId,

        @NotNull
        PolicyCategory category,

        @NotNull
        List<JsonNode> constraints,

        LogicalOperator logicalOperator,

        @NotBlank
        String legalText
) {
}