package org.constructx.policyhub.policies.application.odrl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlAtomicConstraintResponse;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlIdResponse;
import org.constructx.policyhub.policies.domain.ConstraintType;
import org.constructx.policyhub.policies.domain.CredentialRuleOperator;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

public class OdrlConstraintMapper {

    private static final String CX_POLICY_NS =
            "https://w3id.org/catenax/2025/9/policy/";

    /** Participant identity in the EDC namespace, not the Catena-X one. */
    private static final String EDC_CONNECTOR = "edc:connector";

    /** Provisional left operand for the data subset; placeholder until defined. */
    private static final String CON_X_DATA_SUBSET =
            "https://w3id.org/construct-x/policy/DataSubset";

    /** A value of a credential rule that is a number, e.g. a work package number. */
    private static final Pattern NUMBER = Pattern.compile("-?\\d+(?:\\.\\d+)?");

    private OdrlConstraintMapper() {
    }

    public static List<OdrlAtomicConstraintResponse> constraintToOdrl(
            JsonNode constraint
    ) {
        ConstraintType type = constraintType(constraint);

        return switch (type) {
            case DATE_RANGE ->
                    mapDateRange(constraint);

            case PARTICIPANT_DID ->
                    List.of(mapParticipantDid(constraint));

            case DATA_SUBSET ->
                    List.of(mapDataSubset(constraint));

            case CREDENTIAL_ATTRIBUTE ->
                    mapCredentialAttribute(constraint);
        };
    }

    /**
     * Whether the constraint always applies, independent of the logical
     * operator. Such constraints restrict the shared data instead of the
     * consumer; inside {@code odrl:or} they could be bypassed by satisfying
     * another operand.
     */
    public static boolean alwaysApplies(JsonNode constraint) {
        return constraintType(constraint) == ConstraintType.DATA_SUBSET;
    }

    private static ConstraintType constraintType(JsonNode constraint) {
        JsonNode typeNode = constraint.get("type");
        if (typeNode == null || typeNode.isNull()) {
            throw new UnsupportedConstraintException(null);
        }

        String rawType = typeNode.asText();
        try {
            return ConstraintType.valueOf(rawType);
        } catch (IllegalArgumentException e) {
            throw new UnsupportedConstraintException(rawType);
        }
    }

    private static List<OdrlAtomicConstraintResponse> mapDateRange(
            JsonNode constraint
    ) {
        OdrlAtomicConstraintResponse startDateConstraint =
                new OdrlAtomicConstraintResponse(
                        new OdrlIdResponse(
                                CX_POLICY_NS + "DataUsageStartDate"
                        ),
                        new OdrlIdResponse(
                                OdrlOperator.GTEQ.value()
                        ),
                        constraint.get("startDate")
                );

        OdrlAtomicConstraintResponse endDateConstraint =
                new OdrlAtomicConstraintResponse(
                        new OdrlIdResponse(
                                CX_POLICY_NS + "DataUsageEndDate"
                        ),
                        new OdrlIdResponse(
                                OdrlOperator.LTEQ.value()
                        ),
                        constraint.get("endDate")
                );

        return List.of(
                startDateConstraint,
                endDateConstraint
        );
    }

    private static OdrlAtomicConstraintResponse mapParticipantDid(
            JsonNode constraint
    ) {
        List<String> dids = new ArrayList<>();
        constraint.get("dids").forEach(did -> dids.add(did.asText()));

        return new OdrlAtomicConstraintResponse(
                new OdrlIdResponse(EDC_CONNECTOR),
                new OdrlIdResponse(OdrlOperator.EQ.value()),
                String.join(",", dids)
        );
    }

    /** Selectors stay a JSON array, unlike the comma-joined DIDs. */
    private static OdrlAtomicConstraintResponse mapDataSubset(
            JsonNode constraint
    ) {
        return new OdrlAtomicConstraintResponse(
                new OdrlIdResponse(CON_X_DATA_SUBSET),
                new OdrlIdResponse(OdrlOperator.IS_ANY_OF.value()),
                constraint.get("selectors")
        );
    }

    /** One atomic constraint per rule; the rules are combined with AND by the caller. */
    private static List<OdrlAtomicConstraintResponse> mapCredentialAttribute(
            JsonNode constraint
    ) {
        List<OdrlAtomicConstraintResponse> atomics = new ArrayList<>();
        constraint.get("rules").forEach(rule -> atomics.add(mapCredentialRule(rule)));
        return atomics;
    }

    /**
     * Left operand in the format of the ABAC extension:
     * {@code <credential type IRI>.credentialSubject.<path>}. A value list is emitted as a JSON
     * string (e.g. {@code "[7,8]"} or {@code "[\"A\",\"B\"]"}), because the extension does not
     * evaluate a real JSON array.
     */
    private static OdrlAtomicConstraintResponse mapCredentialRule(JsonNode rule) {
        CredentialRuleOperator operator = CredentialRuleOperator
                .fromValue(rule.path("operator").asText())
                .orElseThrow(() -> new UnsupportedConstraintException(
                        ConstraintType.CREDENTIAL_ATTRIBUTE.name()
                ));

        Object rightOperand = operator.valueKind() == CredentialRuleOperator.ValueKind.LIST
                ? credentialValuesToJson(rule.path("values"))
                : rule.path("value");

        return new OdrlAtomicConstraintResponse(
                new OdrlIdResponse(rule.path("credentialType").asText()
                        + ".credentialSubject."
                        + rule.path("attributePath").asText()),
                new OdrlIdResponse("odrl:" + operator.value()),
                rightOperand
        );
    }

    /**
     * Value list as JSON string: numbers only are written as numbers ({@code [7,8]}), anything
     * else as strings. Must stay identical to {@code credentialValuesToJson} in the frontend.
     */
    private static String credentialValuesToJson(JsonNode values) {
        boolean allNumbers = true;
        for (JsonNode value : values) {
            allNumbers &= NUMBER.matcher(value.asText()).matches();
        }
        if (!allNumbers) {
            return values.toString();
        }
        ArrayNode numbers = JsonNodeFactory.instance.arrayNode();
        values.forEach(value -> numbers.add(new BigDecimal(value.asText())));
        return numbers.toString();
    }

    private enum OdrlOperator {
        EQ("odrl:eq"),
        IS_ANY_OF("odrl:isAnyOf"),
        GTEQ("odrl:gteq"),
        LTEQ("odrl:lteq");

        private final String value;

        OdrlOperator(String value) {
            this.value = value;
        }

        public String value() {
            return value;
        }
    }
}