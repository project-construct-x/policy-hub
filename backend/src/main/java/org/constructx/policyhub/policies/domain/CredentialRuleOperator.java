package org.constructx.policyhub.policies.domain;

import java.util.Arrays;
import java.util.Optional;

/**
 * Comparison operators of a {@link ConstraintType#CREDENTIAL_ATTRIBUTE} rule.
 *
 * <p>The values mirror {@code CREDENTIAL_RULE_OPERATORS} in the frontend constraint model and
 * are a subset of the operators the ABAC extension of the Construct-X connector evaluates.</p>
 */
public enum CredentialRuleOperator {

    EQ("eq", ValueKind.TEXT),
    NEQ("neq", ValueKind.TEXT),
    GT("gt", ValueKind.NUMBER),
    GTEQ("gteq", ValueKind.NUMBER),
    LT("lt", ValueKind.NUMBER),
    LTEQ("lteq", ValueKind.NUMBER),
    IS_ANY_OF("isAnyOf", ValueKind.LIST),
    IS_NONE_OF("isNoneOf", ValueKind.LIST);

    /**
     * Which field of a rule holds the comparison value: {@code value} for TEXT and NUMBER,
     * {@code values} for LIST.
     */
    public enum ValueKind {
        TEXT,
        NUMBER,
        LIST
    }

    private final String value;
    private final ValueKind valueKind;

    CredentialRuleOperator(String value, ValueKind valueKind) {
        this.value = value;
        this.valueKind = valueKind;
    }

    /** Wire value as used in the request body and, prefixed with {@code odrl:}, in ODRL. */
    public String value() {
        return value;
    }

    public ValueKind valueKind() {
        return valueKind;
    }

    public static Optional<CredentialRuleOperator> fromValue(String value) {
        return Arrays.stream(values())
                .filter(operator -> operator.value.equals(value))
                .findFirst();
    }
}
