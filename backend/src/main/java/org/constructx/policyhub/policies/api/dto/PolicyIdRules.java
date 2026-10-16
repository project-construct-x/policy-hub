package org.constructx.policyhub.policies.api.dto;

/**
 * Allowed character set of the business {@code policyId}: a letter or digit first, then also
 * dot, underscore and hyphen.
 *
 * <p>The value becomes the JSON-LD {@code @id} of the ODRL output. A free-form string could form an
 * absolute IRI ({@code https://...}) or a blank node reference ({@code _:b0}) and thereby point to a
 * foreign PolicyDefinition. Mirrors {@code POLICY_ID_PATTERN} in the frontend's
 * {@code constraint-validators.ts}.
 */
public final class PolicyIdRules {

    public static final String PATTERN = "^[a-zA-Z0-9][a-zA-Z0-9._-]*$";

    public static final String PATTERN_MESSAGE =
            "policyId must start with a letter or digit and contain only letters, digits, '.', '_' and '-'";

    private PolicyIdRules() {
    }
}
