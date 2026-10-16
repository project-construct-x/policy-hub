package org.constructx.policyhub.policies.application.odrl;

/**
 * A stored constraint has a missing or unknown type and cannot be mapped to ODRL. The export fails
 * instead of skipping the constraint: a dropped AND operand would hand the connector a less strict
 * policy without anyone noticing.
 */
public class UnsupportedConstraintException extends RuntimeException {

    private final String rawType;

    UnsupportedConstraintException(String rawType) {
        super(describe(rawType) + "; ODRL export is not possible");
        this.rawType = rawType;
    }

    UnsupportedConstraintException(String policyId, String rawType) {
        super("Policy " + policyId + " contains " + describe(rawType) + "; ODRL export is not possible");
        this.rawType = rawType;
    }

    String rawType() {
        return rawType;
    }

    private static String describe(String rawType) {
        return rawType == null
                ? "a constraint without type"
                : "unsupported constraint type '" + rawType + "'";
    }
}
