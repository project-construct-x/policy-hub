package org.constructx.policyhub.policies.domain;

/**
 * Rules for the business {@code policyId}. Every policy created in the Hub carries
 * {@link #PREFIX}, so Hub policies are recognisable in the connector.
 */
public final class PolicyId {

    public static final String PREFIX = "con-x-ph-";

    /** Prefix followed by at least one non-whitespace character. */
    public static final String PATTERN = "^" + PREFIX + "\\S.*$";

    private PolicyId() {
    }
}
