package org.constructx.policyhub.policies.application.odrl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlAtomicConstraintResponse;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class OdrlConstraintMapperTest {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    private static final String CX_POLICY_NS =
            "https://w3id.org/catenax/2025/9/policy/";

    @Test
    void mapMembership_mapsMembershipConstraint() throws Exception {
        JsonNode constraint = createConstraint(
                "MEMBERSHIP",
                """
                "value": "active"
                """
        );

        JsonNode expected = createExpected(
                "Membership",
                "odrl:eq",
                "\"active\""
        );

        assertSingleMapping(constraint, expected);
    }

    @Test
    void mapUseCase_mapsUseCaseConstraint() throws Exception {
        JsonNode constraint = createConstraint(
                "USE_CASE",
                """
                "useCases": [
                    "UC.quality-assurance",
                    "UC.material-testing"
                ]
                """
        );

        JsonNode expected = createExpected(
                "UsagePurpose",
                "odrl:isAnyOf",
                """
                [
                    "UC.quality-assurance",
                    "UC.material-testing"
                ]
                """
        );

        assertSingleMapping(constraint, expected);
    }

    @Test
    void mapDateRange_mapsStartAndEndDateConstraints() throws Exception {
        JsonNode constraint = createConstraint(
                "DATE_RANGE",
                """
                "startDate": "2027-01-01",
                "endDate": "2027-06-30"
                """
        );

        JsonNode expectedStartDate = createExpected(
                "DataUsageStartDate",
                "odrl:gteq",
                "\"2027-01-01\""
        );

        JsonNode expectedEndDate = createExpected(
                "DataUsageEndDate",
                "odrl:lteq",
                "\"2027-06-30\""
        );

        List<OdrlAtomicConstraintResponse> results =
                OdrlConstraintMapper.constraintToOdrl(constraint);

        assertEquals(2, results.size());

        JsonNode actualStartDate =
                objectMapper.valueToTree(results.get(0));

        JsonNode actualEndDate =
                objectMapper.valueToTree(results.get(1));

        assertEquals(expectedStartDate, actualStartDate);
        assertEquals(expectedEndDate, actualEndDate);
    }

    @Test
    void mapFrameworkAgreement_mapsFrameworkAgreementConstraint()
            throws Exception {
        JsonNode constraint = createConstraint(
                "FRAMEWORK_AGREEMENT",
                """
                "agreement": "DataExchangeGovernance"
                """
        );

        JsonNode expected = createExpected(
                "FrameworkAgreement",
                "odrl:eq",
                "\"DataExchangeGovernance\""
        );

        assertSingleMapping(constraint, expected);
    }

    private JsonNode createConstraint(
            String type,
            String fields
    ) throws Exception {
        return objectMapper.readTree("""
                {
                    "dummy": "test",
                    "type": "%s",
                    %s
                }
                """.formatted(type, fields));
    }

    private JsonNode createExpected(
            String leftOperandValue,
            String operatorValue,
            String rightOperandJsonValue
    ) throws Exception {
        return objectMapper.readTree("""
                {
                    "odrl:leftOperand": {
                        "@id": "%s%s"
                    },
                    "odrl:operator": {
                        "@id": "%s"
                    },
                    "odrl:rightOperand": %s
                }
                """.formatted(
                CX_POLICY_NS,
                leftOperandValue,
                operatorValue,
                rightOperandJsonValue
        ));
    }

    private void assertSingleMapping(
            JsonNode constraint,
            JsonNode expected
    ) {
        List<OdrlAtomicConstraintResponse> results =
                OdrlConstraintMapper.constraintToOdrl(constraint);

        assertEquals(1, results.size());

        JsonNode actual =
                objectMapper.valueToTree(results.getFirst());

        assertEquals(expected, actual);
    }
}