package org.constructx.policyhub.policies.api.dto;

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