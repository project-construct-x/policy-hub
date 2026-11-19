package org.constructx.policyhub.policies.application;

import com.fasterxml.jackson.databind.JsonNode;
import org.constructx.policyhub.policies.domain.ConstraintType;
import org.constructx.policyhub.policies.domain.CredentialRuleOperator;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

@Component
public class PolicyValidator {

    /**
     * did:web identifier: host, optional port as {@code %3A<port>}, optional
     * {@code :}-separated path segments. Must stay identical to
     * {@code DID_WEB_PATTERN} in the frontend constraint validators. Commas are
     * excluded, which keeps the comma-joined ODRL right operand unambiguous.
     */
    private static final Pattern DID_WEB = Pattern.compile(
            "did:web:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?"
                    + "(?:\\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*"
                    + "(?:%3[Aa]\\d{1,5})?"
                    + "(?::(?:[A-Za-z0-9._~-]|%[0-9A-Fa-f]{2})+)*"
    );

    /**
     * Data subset selector {@code <kind>:<identifier>}. Must stay identical to
     * {@code DATA_SUBSET_SELECTOR_PATTERN} in the frontend constraint
     * validators. Colons are allowed in the identifier because submodel URNs
     * contain them; whitespace and commas are not.
     */
    private static final Pattern DATA_SUBSET_SELECTOR = Pattern.compile(
            "(field|attribute|submodel|record):[A-Za-z0-9._~:/#-]+"
    );

    /**
     * Full credential type IRI, e.g.
     * {@code https://w3id.org/constructx/credentials/v0.1/MembershipCredential}. Like in the ABAC
     * extension: https, and the last segment starts with an uppercase letter and contains no dot.
     * Must stay identical to {@code CREDENTIAL_TYPE_PATTERN} in the frontend constraint
     * validators.
     */
    private static final Pattern CREDENTIAL_TYPE = Pattern.compile(
            "https://[A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)+(?::\\d{1,5})?"
                    + "(?:/[A-Za-z0-9._~-]+)*/[A-Z][A-Za-z0-9_-]*"
    );

    /**
     * Path in the credentialSubject: dot-separated field names with optional array index,
     * e.g. {@code site.accessLevel} or {@code roles[0]}. Must stay identical to
     * {@code CREDENTIAL_ATTRIBUTE_PATH_PATTERN} in the frontend constraint validators.
     */
    private static final Pattern CREDENTIAL_ATTRIBUTE_PATH = Pattern.compile(
            "[A-Za-z0-9_-]+(?:\\[\\d+])*(?:\\.[A-Za-z0-9_-]+(?:\\[\\d+])*)*"
    );

    /** Comparison value of gt/gteq/lt/lteq. */
    private static final Pattern CREDENTIAL_NUMBER = Pattern.compile(
            "-?\\d+(?:\\.\\d+)?"
    );

    /**
     * Comparison value of eq/neq and entry of a value list: 1-200 characters, no surrounding
     * whitespace, without { } [ ] " \. Without [ and " the ABAC extension never reads a single
     * value as a JSON list. Must stay identical to {@code CREDENTIAL_VALUE_PATTERN} in the
     * frontend constraint validators.
     */
    private static final Pattern CREDENTIAL_VALUE = Pattern.compile(
            "(?=[^\\r\\n\\t]{1,200}\\z)[^\\s{}\\[\\]\"\\\\]"
                    + "(?:[^{}\\[\\]\"\\\\]*[^\\s{}\\[\\]\"\\\\])?"
    );

    private static final String CREDENTIAL_VALUE_RULE =
            "must be 1-200 characters without { } [ ] \" \\ and without surrounding whitespace";

    public void validate(List<JsonNode> constraints) {
        // New policy: no stored constraints, so a DATE_RANGE start date must not be in the past.
        validate(constraints, List.of());
    }

    /**
     * Validates constraints of an edited policy. A DATE_RANGE start date in the past is only
     * accepted if it is unchanged from the stored policy, so that an already running period stays
     * editable while a new or changed start date can never lie in the past.
     */
    public void validate(
            List<JsonNode> constraints,
            List<JsonNode> storedConstraints
    ) {
        Set<ConstraintType> encounteredTypes = new HashSet<>();

        for (int index = 0; index < constraints.size(); index++) {
            JsonNode constraint = constraints.get(index);

            if (constraint == null || !constraint.isObject()) {
                throw new InvalidPolicyException(
                        "constraints[" + index + "] must be an object"
                );
            }

            JsonNode typeNode = constraint.get("type");

            if (typeNode == null || !typeNode.isTextual()
                    || typeNode.asText().isBlank()) {
                throw new InvalidPolicyException(
                        "constraints[" + index + "].type is required"
                );
            }

            String rawType = typeNode.asText();
            ConstraintType type = parseType(rawType);

            if (!encounteredTypes.add(type)) {
                throw new InvalidPolicyException(
                        "Constraint type may only occur once: " + rawType
                );
            }

            validateConstraint(type, constraint, index, storedConstraints);
        }
    }

    /**
     * Parses the raw, untrusted {@code type} string from the request body into the known
     * {@link ConstraintType}.
     *
     * <p>This is the single point where untrusted input crosses into the enum. Every
     * constraint type the system knows about is defined exactly once, in
     * {@link ConstraintType} itself — {@link #validateConstraint} switches over that enum without
     * a {@code default} branch, so adding or removing a value there is enough to make this class
     * fail to compile until it is updated to match. A type can no longer be silently out of sync between this
     * class and the enum, the way a hand-maintained {@code Set<String>}/{@code Map<String, ...>}
     * of type names could be.</p>
     */
    private ConstraintType parseType(String rawType) {
        try {
            return ConstraintType.valueOf(rawType);
        } catch (IllegalArgumentException exception) {
            throw new InvalidPolicyException(
                    "Unsupported constraint type: " + rawType
            );
        }
    }

    private LocalDate readRequiredDate(
            JsonNode constraint,
            String fieldName,
            int index
    ) {
        JsonNode value = constraint.get(fieldName);

        if (value == null
                || !value.isTextual()
                || value.asText().isBlank()) {
            throw new InvalidPolicyException(
                    "constraints[" + index + "]."
                            + fieldName + " is required"
            );
        }

        try {
            return LocalDate.parse(value.asText());
        } catch (DateTimeParseException exception) {
            throw new InvalidPolicyException(
                    "constraints[" + index + "]."
                            + fieldName
                            + " must be a valid ISO date in YYYY-MM-DD format"
            );
        }
    }

    private void validateDateRange(
            JsonNode constraint,
            int index,
            List<JsonNode> storedConstraints
    ) {
        LocalDate today = LocalDate.now();

        LocalDate startDate = readRequiredDate(
                constraint,
                "startDate",
                index
        );

        LocalDate endDate = readRequiredDate(
                constraint,
                "endDate",
                index
        );

        if (startDate.isBefore(today)
                && !isStoredStartDate(startDate, storedConstraints)) {
            throw new InvalidPolicyException(
                    "constraints[" + index
                            + "].startDate must not be in the past"
            );
        }

        if (endDate.isBefore(today)) {
            throw new InvalidPolicyException(
                    "constraints[" + index
                            + "].endDate must not be in the past"
            );
        }

        if (startDate.isAfter(endDate)) {
            throw new InvalidPolicyException(
                    "constraints[" + index
                            + "].startDate must not be after endDate"
            );
        }
    }

    private boolean isStoredStartDate(
            LocalDate startDate,
            List<JsonNode> storedConstraints
    ) {
        return storedConstraints.stream()
                .filter(stored -> stored != null && stored.isObject())
                .filter(stored -> ConstraintType.DATE_RANGE.name()
                        .equals(stored.path("type").asText()))
                .anyMatch(stored -> startDate.toString()
                        .equals(stored.path("startDate").asText()));
    }

    private void validateConstraint(
            ConstraintType type,
            JsonNode constraint,
            int index,
            List<JsonNode> storedConstraints
    ) {
        switch (type) {
            case DATE_RANGE ->
                    validateDateRange(constraint, index, storedConstraints);
            case PARTICIPANT_DID ->
                    validateParticipantDid(constraint, index);
            case DATA_SUBSET ->
                    validateDataSubset(constraint, index);
            case CREDENTIAL_ATTRIBUTE ->
                    validateCredentialAttribute(constraint, index);
        }
    }

    private void validateParticipantDid(
            JsonNode constraint,
            int index
    ) {
        JsonNode dids = constraint.get("dids");

        if (dids == null || !dids.isArray() || dids.isEmpty()) {
            throw new InvalidPolicyException(
                    "constraints[" + index
                            + "].dids must contain at least one entry"
            );
        }

        Set<String> seen = new HashSet<>();

        for (int didIndex = 0; didIndex < dids.size(); didIndex++) {
            JsonNode did = dids.get(didIndex);
            String path = "constraints[" + index + "].dids[" + didIndex + "]";

            if (!did.isTextual()) {
                throw new InvalidPolicyException(
                        path + " must be a string"
                );
            }

            if (!DID_WEB.matcher(did.asText()).matches()) {
                throw new InvalidPolicyException(
                        path + " must be a valid did:web identifier"
                );
            }

            if (!seen.add(did.asText().toLowerCase(Locale.ROOT))) {
                throw new InvalidPolicyException(
                        path + " is a duplicate"
                );
            }
        }
    }

    private void validateDataSubset(
            JsonNode constraint,
            int index
    ) {
        JsonNode selectors = constraint.get("selectors");

        if (selectors == null || !selectors.isArray() || selectors.isEmpty()) {
            throw new InvalidPolicyException(
                    "constraints[" + index
                            + "].selectors must contain at least one entry"
            );
        }

        Set<String> seen = new HashSet<>();

        for (int selectorIndex = 0; selectorIndex < selectors.size(); selectorIndex++) {
            JsonNode selector = selectors.get(selectorIndex);
            String path = "constraints[" + index + "].selectors["
                    + selectorIndex + "]";

            if (!selector.isTextual()) {
                throw new InvalidPolicyException(
                        path + " must be a string"
                );
            }

            if (!DATA_SUBSET_SELECTOR.matcher(selector.asText()).matches()) {
                throw new InvalidPolicyException(
                        path + " must match <field|attribute|submodel|record>:<identifier>"
                );
            }

            // Case-sensitive on purpose: materialName and MaterialName may be
            // two different fields.
            if (!seen.add(selector.asText())) {
                throw new InvalidPolicyException(
                        path + " is a duplicate"
                );
            }
        }
    }

    private void validateCredentialAttribute(
            JsonNode constraint,
            int index
    ) {
        JsonNode rules = constraint.get("rules");

        if (rules == null || !rules.isArray() || rules.isEmpty()) {
            throw new InvalidPolicyException(
                    "constraints[" + index
                            + "].rules must contain at least one rule"
            );
        }

        for (int ruleIndex = 0; ruleIndex < rules.size(); ruleIndex++) {
            validateCredentialRule(
                    rules.get(ruleIndex),
                    "constraints[" + index + "].rules[" + ruleIndex + "]"
            );
        }
    }

    private void validateCredentialRule(JsonNode rule, String path) {
        if (rule == null || !rule.isObject()) {
            throw new InvalidPolicyException(path + " must be an object");
        }

        String credentialType = readRequiredText(rule, "credentialType", path);
        if (!CREDENTIAL_TYPE.matcher(credentialType).matches()) {
            throw new InvalidPolicyException(
                    path + ".credentialType must be a full https type IRI "
                            + "whose last segment starts with an uppercase letter"
            );
        }

        String attributePath = readRequiredText(rule, "attributePath", path);
        if (!CREDENTIAL_ATTRIBUTE_PATH.matcher(attributePath).matches()) {
            throw new InvalidPolicyException(
                    path + ".attributePath must be dot-separated field names "
                            + "with an optional [index]"
            );
        }

        CredentialRuleOperator operator = Optional.ofNullable(rule.get("operator"))
                .filter(JsonNode::isTextual)
                .flatMap(operatorNode -> CredentialRuleOperator.fromValue(operatorNode.asText()))
                .orElseThrow(() -> new InvalidPolicyException(
                        path + ".operator must be one of "
                                + "eq, neq, gt, gteq, lt, lteq, isAnyOf, isNoneOf"
                ));

        switch (operator.valueKind()) {
            case NUMBER -> {
                String value = readRequiredText(rule, "value", path);
                if (!CREDENTIAL_NUMBER.matcher(value).matches()) {
                    throw new InvalidPolicyException(
                            path + ".value must be a number"
                    );
                }
            }
            case TEXT -> {
                String value = readRequiredText(rule, "value", path);
                if (!CREDENTIAL_VALUE.matcher(value).matches()) {
                    throw new InvalidPolicyException(
                            path + ".value " + CREDENTIAL_VALUE_RULE
                    );
                }
            }
            case LIST -> validateCredentialValues(rule.get("values"), path);
        }
    }

    private void validateCredentialValues(JsonNode values, String path) {
        if (values == null || !values.isArray() || values.isEmpty()) {
            throw new InvalidPolicyException(
                    path + ".values must contain at least one entry"
            );
        }

        Set<String> seen = new HashSet<>();

        for (int valueIndex = 0; valueIndex < values.size(); valueIndex++) {
            JsonNode value = values.get(valueIndex);
            String valuePath = path + ".values[" + valueIndex + "]";

            if (!value.isTextual()) {
                throw new InvalidPolicyException(valuePath + " must be a string");
            }

            if (!CREDENTIAL_VALUE.matcher(value.asText()).matches()) {
                throw new InvalidPolicyException(
                        valuePath + " " + CREDENTIAL_VALUE_RULE
                );
            }

            if (!seen.add(value.asText())) {
                throw new InvalidPolicyException(valuePath + " is a duplicate");
            }
        }
    }

    private String readRequiredText(JsonNode node, String fieldName, String path) {
        JsonNode value = node.get(fieldName);

        if (value == null || !value.isTextual() || value.asText().isEmpty()) {
            throw new InvalidPolicyException(
                    path + "." + fieldName + " is required"
            );
        }

        return value.asText();
    }
}
