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
        @Pattern(regexp = PolicyId.PATTERN, message = "policyId must start with the prefix con-x-policyHub-")
        String policyId,

        @NotNull
        PolicyCategory category,

        @NotNull
        List<JsonNode> constraints,

        /** Optional; defaults to AND if omitted. */
        LogicalOperator logicalOperator,

        @NotBlank
        String legalText
) {
}