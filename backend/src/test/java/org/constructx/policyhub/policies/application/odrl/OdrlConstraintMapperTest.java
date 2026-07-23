package org.constructx.policyhub.policies.application.odrl;



import static org.junit.jupiter.api.Assertions.assertEquals;

import org.constructx.policyhub.policies.api.dto.odrl.OdrlAtomicConstraintResponse;
import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;


public class OdrlConstraintMapperTest {
    
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final String CX_POLICY_NS = "https://w3id.org/catenax/2025/9/policy/";

    @Test
    public void mapMembership_mapsMembershipConstraint() throws Exception {
        String valueJsonString = "\"active\"";

        JsonNode constraint = createConstraint(
            "MEMBERSHIP", 
            "value", 
            valueJsonString
        );

        JsonNode expected = createExpected(
            "Membership", 
            "odrl:eq",
            valueJsonString
        );

        assertMapping(constraint, expected);
    }

    @Test 
    public void mapUseCase_mapsUseCaseConstraint() throws Exception {
        String valueJsonString = """
            [
                "UC.quality-assurance",
                "UC.material-testing"
            ] 
        """;

        JsonNode constraint = createConstraint(
            "USE_CASE", 
            "useCases", 
            valueJsonString
        );

        JsonNode expected = createExpected(
            "UsagePurpose", 
            "odrl:isAnyOf", 
            valueJsonString
        );

        assertMapping(constraint, expected);
    }

    @Test
    public void mapEndDate_mapsEndDateConstraint() throws Exception {
        String valueJsonString = "\"2027-12-31\"";

        JsonNode constraint = createConstraint(
            "END_DATE", 
            "endDate", 
            valueJsonString
        );

        JsonNode expected = createExpected(
            "DataUsageEndDate", 
            "odrl:eq", 
            valueJsonString
        );

        assertMapping(constraint, expected);
    }

    @Test
    public void mapFrameworkAgreement_mapsFrameworkAgreementConstraint() throws Exception {
        String valueJsonString = "\"DataExchangeGovernance\"";

        JsonNode constraint = createConstraint(
            "FRAMEWORK_AGREEMENT", 
            "agreement", 
            valueJsonString
        );

        JsonNode expected = createExpected(
            "FrameworkAgreement", 
            "odrl:eq", 
            valueJsonString
        );

        assertMapping(constraint, expected);
    }

    private JsonNode createConstraint(String type, String valueKey, String valueJsonString) throws Exception {
        return objectMapper.readTree("""
            {
                "dummy": "test",
                "type": "%s",
                "%s": %s
            }
        """.formatted(type, valueKey, valueJsonString));
    }

    private JsonNode createExpected(String leftOperandValue, String operatorValue, String rightOperandJsonValue) throws Exception {
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

    private void assertMapping(JsonNode constraint, JsonNode expected) {
        OdrlAtomicConstraintResponse odrlResult = OdrlConstraintMapper.constraintToOdrl(constraint);
        JsonNode actual = objectMapper.valueToTree(odrlResult);

        assertEquals(expected, actual);
    }
}
