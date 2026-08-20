package org.constructx.policyhub.policies.application.odrl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.constructx.policyhub.policies.api.dto.odrl.OdrlPolicyDefinitionResponse;
import org.constructx.policyhub.policies.domain.Policy;
import org.constructx.policyhub.policies.domain.PolicyCategory;
import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;


public class OdrlPolicyMapperTest {
    private static final ObjectMapper objectMapper = new ObjectMapper(); 
    private static final OdrlPolicyMapper odrlPolicyMapper = new OdrlPolicyMapper(); 
    private static final String CX_POLICY_NS = "https://w3id.org/catenax/2025/9/policy/";
    private static final String ODRL_USE = "odrl:use";
    private static final String CX_ACCESS = CX_POLICY_NS + "access";

    private Policy createPolicy(
            List<JsonNode> constraints
    ) {
        return new Policy(
                UUID.fromString(
                        "00000000-0000-0000-0000-000000000001"
                ),
                "Policy Id",
                PolicyCategory.CONTRACT,
                constraints,
                "Legal Text",
                Instant.parse("2026-03-15T10:30:00Z"),
                Instant.parse("2026-04-29T09:40:00Z")
        );
    }

    private JsonNode mapToJson(Policy policy) {
        OdrlPolicyDefinitionResponse response =
                odrlPolicyMapper.policyToOdrl(policy);

        return objectMapper.valueToTree(response);
    }

    private void assertAtomicConstraint(
            JsonNode actual,
            String expectedLeftOperand,
            String expectedOperator,
            String expectedRightOperand
    ) {
        assertEquals(
                CX_POLICY_NS + expectedLeftOperand,
                actual.path("odrl:leftOperand")
                        .path("@id")
                        .asText()
        );

        assertEquals(
                expectedOperator,
                actual.path("odrl:operator")
                        .path("@id")
                        .asText()
        );

        assertEquals(
                expectedRightOperand,
                actual.path("odrl:rightOperand")
                        .asText()
        );
    }
    
    @Test
    public void policyToOdrl_mapsBasicOdrlStructure() {
        Policy policy = new Policy(
            UUID.randomUUID(), 
            "Policy Id", 
            PolicyCategory.ACCESS, 
            List.of(), 
            "Legal Text", 
            Instant.now(), 
            Instant.now()
        );

        OdrlPolicyDefinitionResponse response = odrlPolicyMapper.policyToOdrl(policy);
        JsonNode actual = objectMapper.valueToTree(response);
        JsonNode context = actual.get("@context");
        JsonNode policyField = actual.get("policy");

        assertTrue(actual.has("@context"));
        assertTrue(actual.has("@type"));
        assertTrue(actual.has("@id"));
        assertTrue(actual.has("policy"));

        assertTrue(context.has("@vocab"));
        assertTrue(context.has("edc"));
        assertTrue(context.has("odrl"));

        assertTrue(policyField.has("@context"));
        assertTrue(policyField.has("@type"));
        assertTrue(policyField.has("odrl:permission"));
        assertTrue(policyField.has("odrl:prohibition"));
        assertTrue(policyField.has("odrl:obligation"));
    }

    @Test
    public void policyToOdrl_mapsAccessPolicyToAccessAction() {
        Policy policy = new Policy(
            UUID.randomUUID(), 
            "Policy Id", 
            PolicyCategory.ACCESS, 
            List.of(), 
            "Legal Text", 
            Instant.now(), 
            Instant.now()
        );

        OdrlPolicyDefinitionResponse response = odrlPolicyMapper.policyToOdrl(policy);
        JsonNode actual = objectMapper.valueToTree(response);
        JsonNode actionValue = actual.get("policy")
                                .get("odrl:permission")
                                .get(0)
                                .get("odrl:action")
                                .get("@id");

        assertEquals(CX_ACCESS, actionValue.asText());
    }

    @Test
    public void policyToOdrl_mapsContractPolicyToUseAction() {
        Policy policy = new Policy(
            UUID.randomUUID(), 
            "Policy Id", 
            PolicyCategory.CONTRACT, 
            List.of(), 
            "Legal Text", 
            Instant.now(), 
            Instant.now()
        );

        OdrlPolicyDefinitionResponse response = odrlPolicyMapper.policyToOdrl(policy);
        JsonNode actual = objectMapper.valueToTree(response);
        JsonNode actionValue = actual.get("policy")
                                .get("odrl:permission")
                                .get(0)
                                .get("odrl:action")
                                .get("@id");

        assertEquals(ODRL_USE, actionValue.asText());
    }

    @Test
    public void policyToOdrl_omitsConstraintForEmptyConstraintList() {
        Policy policy = new Policy(
            UUID.randomUUID(), 
            "Policy Id", 
            PolicyCategory.CONTRACT, 
            List.of(), 
            "Legal Text", 
            Instant.now(), 
            Instant.now()
        );

        OdrlPolicyDefinitionResponse response = odrlPolicyMapper.policyToOdrl(policy);
        JsonNode actual = objectMapper.valueToTree(response);

        JsonNode permissions = actual.get("policy")
                                .get("odrl:permission");

        assertEquals(1, permissions.size());

        JsonNode permission = permissions.get(0);

        assertTrue(permission.has("odrl:action"));
        assertFalse(permission.has("odrl:constraint"));
    }

    @Test
    public void policyToOdrl_addsConstraintGroupForNonEmptyConstraintList() throws Exception {
        JsonNode policyConstraint = objectMapper.readTree("""
            {
                "type": "MEMBERSHIP",
                "value": "active"
            }
        """);
        
        Policy policy = new Policy(
            UUID.randomUUID(), 
            "Policy Id", 
            PolicyCategory.CONTRACT, 
            List.of(policyConstraint), 
            "Legal Text", 
            Instant.now(), 
            Instant.now()
        );

        OdrlPolicyDefinitionResponse response = odrlPolicyMapper.policyToOdrl(policy);
        JsonNode actual = objectMapper.valueToTree(response);
        JsonNode permissions = actual.get("policy")
                                .get("odrl:permission");
        JsonNode permission = permissions.get(0);
        JsonNode constraint = permission.get("odrl:constraint");
        JsonNode and = constraint.get("odrl:and");

        assertEquals(1, permissions.size());

        assertTrue(permission.has("odrl:action"));
        assertTrue(permission.has("odrl:constraint"));

        assertTrue(constraint.has("odrl:and"));

        assertEquals(1, and.size());
    }

    @Test
    void policyToOdrl_mapsDateRangeToStartAndEndConstraints()
            throws Exception {
        JsonNode dateRange = objectMapper.readTree("""
            {
              "type": "DATE_RANGE",
              "startDate": "2027-01-01",
              "endDate": "2027-06-30"
            }
            """);

        Policy policy = createPolicy(
                List.of(dateRange)
        );

        JsonNode actual = mapToJson(policy);

        JsonNode and = actual
                .path("policy")
                .path("odrl:permission")
                .path(0)
                .path("odrl:constraint")
                .path("odrl:and");

        assertEquals(2, and.size());

        JsonNode startConstraint = and.get(0);

        assertEquals(
                CX_POLICY_NS + "DataUsageStartDate",
                startConstraint
                        .path("odrl:leftOperand")
                        .path("@id")
                        .asText()
        );

        assertEquals(
                "odrl:gteq",
                startConstraint
                        .path("odrl:operator")
                        .path("@id")
                        .asText()
        );

        assertEquals(
                "2027-01-01",
                startConstraint
                        .path("odrl:rightOperand")
                        .asText()
        );

        JsonNode endConstraint = and.get(1);

        assertEquals(
                CX_POLICY_NS + "DataUsageEndDate",
                endConstraint
                        .path("odrl:leftOperand")
                        .path("@id")
                        .asText()
        );

        assertEquals(
                "odrl:lteq",
                endConstraint
                        .path("odrl:operator")
                        .path("@id")
                        .asText()
        );

        assertEquals(
                "2027-06-30",
                endConstraint
                        .path("odrl:rightOperand")
                        .asText()
        );
    }

    @Test
    void policyToOdrl_mapsMultipleConstraintsIntoSingleAndGroup()
            throws Exception {
        JsonNode membership = objectMapper.readTree("""
            {
              "type": "MEMBERSHIP",
              "value": "active"
            }
            """);

        JsonNode frameworkAgreement = objectMapper.readTree("""
            {
              "type": "FRAMEWORK_AGREEMENT",
              "agreement": "DataExchangeGovernance"
            }
            """);

        JsonNode dateRange = objectMapper.readTree("""
            {
              "type": "DATE_RANGE",
              "startDate": "2027-01-01",
              "endDate": "2027-06-30"
            }
            """);

        Policy policy = createPolicy(
                List.of(
                        membership,
                        frameworkAgreement,
                        dateRange
                )
        );

        JsonNode actual = mapToJson(policy);

        JsonNode and = actual
                .path("policy")
                .path("odrl:permission")
                .path(0)
                .path("odrl:constraint")
                .path("odrl:and");

        // MEMBERSHIP          -> 1
        // FRAMEWORK_AGREEMENT -> 1
        // DATE_RANGE          -> 2, DATE_RANGE wird in zwei ODRL-Bedingungen aufgeteilt
        assertEquals(4, and.size());

        assertAtomicConstraint(
                and.get(0),
                "Membership",
                "odrl:eq",
                "active"
        );

        assertAtomicConstraint(
                and.get(1),
                "FrameworkAgreement",
                "odrl:eq",
                "DataExchangeGovernance"
        );

        assertAtomicConstraint(
                and.get(2),
                "DataUsageStartDate",
                "odrl:gteq",
                "2027-01-01"
        );

        assertAtomicConstraint(
                and.get(3),
                "DataUsageEndDate",
                "odrl:lteq",
                "2027-06-30"
        );
    }

    @Test
    void policyToOdrl_mapsUseCasesAsArray()
            throws Exception {
        JsonNode useCase = objectMapper.readTree("""
            {
              "type": "USE_CASE",
              "useCases": [
                "UC.quality-assurance",
                "UC.material-testing"
              ]
            }
            """);

        Policy policy = createPolicy(
                List.of(useCase)
        );

        JsonNode actual = mapToJson(policy);

        JsonNode atomic = actual
                .path("policy")
                .path("odrl:permission")
                .path(0)
                .path("odrl:constraint")
                .path("odrl:and")
                .path(0);

        assertEquals(
                CX_POLICY_NS + "UsagePurpose",
                atomic.path("odrl:leftOperand")
                        .path("@id")
                        .asText()
        );

        assertEquals(
                "odrl:isAnyOf",
                atomic.path("odrl:operator")
                        .path("@id")
                        .asText()
        );

        JsonNode rightOperand =
                atomic.path("odrl:rightOperand");

        assertTrue(rightOperand.isArray());
        assertEquals(2, rightOperand.size());
        assertEquals(
                "UC.quality-assurance",
                rightOperand.get(0).asText()
        );
        assertEquals(
                "UC.material-testing",
                rightOperand.get(1).asText()
        );
    }

    @Test
    void policyToOdrl_usesBusinessPolicyIdAsOdrlId() {
        Policy policy = new Policy(
                UUID.randomUUID(),
                "bim-koordination-q2-2027",
                PolicyCategory.CONTRACT,
                List.of(),
                "Legal Text",
                Instant.now(),
                Instant.now()
        );

        JsonNode actual = mapToJson(policy);

        assertEquals(
                "bim-koordination-q2-2027",
                actual.path("@id").asText()
        );
    }
}
