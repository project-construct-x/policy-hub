package org.constructx.policyhub.policies.domain;

/**
 * Defines how the constraints of a policy are combined.
 * <p>
 * Named "logical operator" on purpose to distinguish it from the comparison
 * operator of a single constraint ({@code odrl:eq}, {@code odrl:gteq}, ...).
 */
public enum LogicalOperator {

    /**
     * All constraints must be fulfilled ({@code odrl:and}).
     */
    AND,

    /**
     * At least one constraint must be fulfilled ({@code odrl:or}).
     */
    OR;

    /**
     * Older clients and records do not provide a logical operator; they are
     * treated as {@link #AND}.
     */
    public static LogicalOperator orDefault(LogicalOperator logicalOperator) {
        return logicalOperator == null ? AND : logicalOperator;
    }
}
