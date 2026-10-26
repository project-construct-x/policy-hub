package org.constructx.policyhub.policies.application;

import com.fasterxml.jackson.databind.JsonNode;
import org.constructx.policyhub.policies.domain.ConstraintType;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
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

    public void validate(List<JsonNode> constraints) {
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

            validateConstraint(type, constraint, index);
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
            int index
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

        if (startDate.isBefore(today)) {
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

    private void validateConstraint(
            ConstraintType type,
            JsonNode constraint,
            int index
    ) {
        switch (type) {
            case MEMBERSHIP ->
                    validateMembership(constraint, index);
            case DATE_RANGE ->
                    validateDateRange(constraint, index);
            case FRAMEWORK_AGREEMENT ->
                    validateFrameworkAgreement(constraint, index);
            case PARTICIPANT_DID ->
                    validateParticipantDid(constraint, index);
        }
    }

    private void validateMembership(JsonNode constraint, int index) {
        JsonNode value = constraint.get("value");

        if (value == null || !value.isTextual()
                || value.asText().isBlank()) {
            throw new InvalidPolicyException(
                    "constraints[" + index + "].value is required"
            );
        }

        if (!"active".equals(value.asText())) {
            throw new InvalidPolicyException(
                    "constraints[" + index + "].value must be 'active'"
            );
        }
    }

    private void validateFrameworkAgreement(
            JsonNode constraint,
            int index
    ) {
        JsonNode agreement = constraint.get("agreement");

        if (agreement == null || !agreement.isTextual()
                || agreement.asText().isBlank()) {
            throw new InvalidPolicyException(
                    "constraints[" + index + "].agreement is required"
            );
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
}
