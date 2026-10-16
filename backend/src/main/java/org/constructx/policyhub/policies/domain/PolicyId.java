package org.constructx.policyhub.policies.domain;

/**
 * Rules for the business {@code policyId}. Every policy created in the Hub carries
 * {@link #PREFIX}, so Hub policies are recognisable in the connector.
 *
 * <p>After the prefix only letters, digits, dot, underscore and hyphen are allowed. The value
 * becomes the JSON-LD {@code @id} of the ODRL output; a colon, slash or {@code #} could turn it
 * into an absolute IRI ({@code con-x-ph-x:evil}) and thereby point to a foreign PolicyDefinition.
 * Mirrors {@code POLICY_ID_PREFIX} and {@code POLICY_ID_PATTERN} in the frontend.
 */
public final class PolicyId {

    public static final String PREFIX = "con-x-ph-";

    /** Prefix followed by at least one letter, digit, '.', '_' or '-'. */
    public static final String PATTERN = "^" + PREFIX + "[a-zA-Z0-9._-]+$";

    public static final String PATTERN_MESSAGE = "policyId must start with the prefix " + PREFIX
            + " followed only by letters, digits, '.', '_' and '-'";

    private PolicyId() {
    }
}
