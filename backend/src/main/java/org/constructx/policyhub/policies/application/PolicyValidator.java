package org.constructx.policyhub.policies.application;

import com.fasterxml.jackson.databind.JsonNode;
import org.constructx.policyhub.policies.domain.PolicyCategory;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.Map;

@Component
public class PolicyValidator {

    private static final Set<String> SUPPORTED_TYPES = Set.of(
            "MEMBERSHIP",
            "USE_CASE",
            "DATE_RANGE",
            "FRAMEWORK_AGREEMENT"
    );

    private static final Map<String, Set<PolicyCategory>> ALLOWED_CATEGORIES =
            Map.of(
                    "MEMBERSHIP",
                    Set.of(
                            PolicyCategory.ACCESS,
                            PolicyCategory.CONTRACT
                    ),
                    "USE_CASE",
                    Set.of(
                            PolicyCategory.ACCESS,
                            PolicyCategory.CONTRACT
                    ),
                    "DATE_RANGE",
                    Set.of(
                            PolicyCategory.CONTRACT
                    ),
                    "FRAMEWORK_AGREEMENT",
                    Set.of(
                            PolicyCategory.ACCESS,
                            PolicyCategory.CONTRACT
                    )
            );

    public void validate(
            PolicyCategory category,
            List<JsonNode> constraints
    ) {
        Set<String> encounteredTypes = new HashSet<>();

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

            String type = typeNode.asText();

            if (!SUPPORTED_TYPES.contains(type)) {
                throw new InvalidPolicyException(
                        "Unsupported constraint type: " + type
                );
            }

            if (!encounteredTypes.add(type)) {
                throw new InvalidPolicyException(
                        "Constraint type may only occur once: " + type
                );
            }

            validateConstraint(type, constraint, index);
            validateCategoryCompatibility(category, type, index);
        }
    }

    private LocalDate readRequiredDate(
            JsonNode constraint,
            String fieldName,
            int index
    ) {
        JsonNode dateNode = constraint.get(fieldName);

        if (dateNode == null
                || !dateNode.isTextual()
                || dateNode.asText().isBlank()) {
            throw new InvalidPolicyException(
                    "constraints[" + index + "]."
                            + fieldName + " is required"
            );
        }

        try {
            return LocalDate.parse(dateNode.asText());
        } catch (DateTimeParseException ex) {
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

        if (startDate.isAfter(endDate)) {
            throw new InvalidPolicyException(
                    "constraints[" + index
                            + "].startDate must not be after endDate"
            );
        }
    }

    private void validateConstraint(
            String type,
            JsonNode constraint,
            int index
    ) {
        switch (type) {
            case "MEMBERSHIP" ->
                    validateMembership(constraint, index);
            case "USE_CASE" ->
                    validateUseCase(constraint, index);
            case "DATE_RANGE" ->
                    validateDateRange(constraint, index);
            case "FRAMEWORK_AGREEMENT" ->
                    validateFrameworkAgreement(constraint, index);
            default ->
                    throw new InvalidPolicyException(
                            "constraints[" + index
                                    + "].type is unsupported: " + type
                    );
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

    private void validateUseCase(JsonNode constraint, int index) {
        JsonNode useCases = constraint.get("useCases");

        if (useCases == null || !useCases.isArray()
                || useCases.isEmpty()) {
            throw new InvalidPolicyException(
                    "constraints[" + index + "].useCases must contain at least one value"
            );
        }

        for (JsonNode useCase : useCases) {
            if (!useCase.isTextual() || useCase.asText().isBlank()) {
                throw new InvalidPolicyException(
                        "constraints[" + index + "].useCases must contain only non-empty strings"
                );
            }
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


    private void validateCategoryCompatibility(
            PolicyCategory category,
            String type,
            int index
    ) {
        Set<PolicyCategory> allowedCategories =
                ALLOWED_CATEGORIES.get(type);

        if (allowedCategories == null) {
            throw new InvalidPolicyException(
                    "constraints[" + index
                            + "].type is unsupported: " + type
            );
        }

        if (!allowedCategories.contains(category)) {
            throw new InvalidPolicyException(
                    "constraints[" + index
                            + "] of type " + type
                            + " is not allowed for category " + category
            );
        }
    }
}