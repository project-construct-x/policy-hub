package org.constructx.policyhub.policies.application.odrl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.constructx.policyhub.policies.api.dto.odrl.OdrlPolicyDefinitionResponse;
import org.constructx.policyhub.policies.domain.Policy;
import org.constructx.policyhub.policies.domain.LogicalOperator;
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
        return createPolicy(constraints, LogicalOperator.AND);
    }

    private Policy createPolicy(
            List<JsonNode> constraints,
            LogicalOperator logicalOperator
    ) {
        return new Policy(
                UUID.fromString(
                        "00000000-0000-0000-0000-000000000001"
                ),
                "Policy Id",
                PolicyCategory.CONTRACT,
                constraints,
                logicalOperator,
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
            LogicalOperator.AND, 
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
            LogicalOperator.AND, 
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
            LogicalOperator.AND, 
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
            LogicalOperator.AND, 
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
            LogicalOperator.AND, 
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
    void policyToOdrl_withUnknownConstraintType_failsInsteadOfDroppingIt() throws Exception {
        Policy policy = createPolicy(List.of(
                objectMapper.readTree("""
                        { "type": "MEMBERSHIP", "value": "active" }
                        """),
                objectMapper.readTree("""
                        { "type": "GIBTS_NICHT", "value": "x" }
                        """)
        ));

        UnsupportedConstraintException ex = assertThrows(
                UnsupportedConstraintException.class,
                () -> odrlPolicyMapper.policyToOdrl(policy)
        );

        assertEquals(
                "Policy Policy Id contains unsupported constraint type 'GIBTS_NICHT'; "
                        + "ODRL export is not possible",
                ex.getMessage()
        );
    }

    @Test
    void policyToOdrl_usesBusinessPolicyIdAsOdrlId() {
        Policy policy = new Policy(
                UUID.randomUUID(),
                "bim-koordination-q2-2027",
                PolicyCategory.CONTRACT,
                List.of(),
                LogicalOperator.AND,
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

    private JsonNode constraintGroup(Policy policy) {
        return mapToJson(policy)
                .path("policy")
                .path("odrl:permission")
                .path(0)
                .path("odrl:constraint");
    }

    private JsonNode membership() throws Exception {
        return objectMapper.readTree("""
            {
              "type": "MEMBERSHIP",
              "value": "active"
            }
            """);
    }

    private JsonNode frameworkAgreement() throws Exception {
        return objectMapper.readTree("""
            {
              "type": "FRAMEWORK_AGREEMENT",
              "agreement": "DataExchangeGovernance"
            }
            """);
    }

    private JsonNode dateRange() throws Exception {
        return objectMapper.readTree("""
            {
              "type": "DATE_RANGE",
              "startDate": "2027-01-01",
              "endDate": "2027-06-30"
            }
            """);
    }

    private JsonNode participantDid() throws Exception {
        return objectMapper.readTree("""
            {
              "type": "PARTICIPANT_DID",
              "dids": ["did:web:a.example", "did:web:b.example"]
            }
            """);
    }

    private void assertParticipantDidConstraint(JsonNode actual) {
        assertEquals(
                "edc:connector",
                actual.path("odrl:leftOperand").path("@id").asText()
        );
        assertEquals(
                "odrl:eq",
                actual.path("odrl:operator").path("@id").asText()
        );
        assertEquals(
                "did:web:a.example,did:web:b.example",
                actual.path("odrl:rightOperand").asText()
        );
    }

    @Test
    void policyToOdrl_keepsParticipantDidFlatForAnd() throws Exception {
        Policy policy = createPolicy(
                List.of(participantDid(), membership()),
                LogicalOperator.AND
        );

        JsonNode and = constraintGroup(policy).path("odrl:and");

        assertEquals(2, and.size());
        assertParticipantDidConstraint(and.get(0));
        assertAtomicConstraint(and.get(1), "Membership", "odrl:eq", "active");
    }

    @Test
    void policyToOdrl_mapsParticipantDidAsSingleOperandForOr() throws Exception {
        Policy policy = createPolicy(
                List.of(participantDid(), membership()),
                LogicalOperator.OR
        );

        JsonNode or = constraintGroup(policy).path("odrl:or");

        assertEquals(2, or.size());
        assertFalse(or.get(0).has("odrl:and"));
        assertParticipantDidConstraint(or.get(0));
        assertAtomicConstraint(or.get(1), "Membership", "odrl:eq", "active");
    }

    @Test
    void policyToOdrl_treatsMissingLogicalOperatorAsAnd() throws Exception {
        Policy policy = createPolicy(
                List.of(membership(), frameworkAgreement()),
                null
        );

        JsonNode constraint = constraintGroup(policy);

        assertTrue(constraint.has("odrl:and"));
        assertFalse(constraint.has("odrl:or"));
        assertEquals(2, constraint.path("odrl:and").size());
    }

    @Test
    void policyToOdrl_keepsDateRangeFlatForAnd() throws Exception {
        Policy policy = createPolicy(
                List.of(membership(), dateRange()),
                LogicalOperator.AND
        );

        JsonNode and = constraintGroup(policy).path("odrl:and");

        assertEquals(3, and.size());
        assertAtomicConstraint(and.get(0), "Membership", "odrl:eq", "active");
        assertAtomicConstraint(and.get(1), "DataUsageStartDate", "odrl:gteq", "2027-01-01");
        assertAtomicConstraint(and.get(2), "DataUsageEndDate", "odrl:lteq", "2027-06-30");
    }

    @Test
    void policyToOdrl_mapsOrToOdrlOrWithOneOperandPerConstraint() throws Exception {
        Policy policy = createPolicy(
                List.of(membership(), frameworkAgreement()),
                LogicalOperator.OR
        );

        JsonNode constraint = constraintGroup(policy);
        JsonNode or = constraint.path("odrl:or");

        assertFalse(constraint.has("odrl:and"));
        assertEquals(2, or.size());
        assertAtomicConstraint(or.get(0), "Membership", "odrl:eq", "active");
        assertAtomicConstraint(
                or.get(1),
                "FrameworkAgreement",
                "odrl:eq",
                "DataExchangeGovernance"
        );
    }

    @Test
    void policyToOdrl_nestsDateRangeAsAndInsideOr() throws Exception {
        Policy policy = createPolicy(
                List.of(membership(), dateRange()),
                LogicalOperator.OR
        );

        JsonNode or = constraintGroup(policy).path("odrl:or");

        // DATE_RANGE stays "start AND end"; flat inside odrl:or it would mean "start OR end"
        assertEquals(2, or.size());
        assertAtomicConstraint(or.get(0), "Membership", "odrl:eq", "active");

        JsonNode nestedAnd = or.get(1).path("odrl:and");
        assertEquals(2, nestedAnd.size());
        assertAtomicConstraint(nestedAnd.get(0), "DataUsageStartDate", "odrl:gteq", "2027-01-01");
        assertAtomicConstraint(nestedAnd.get(1), "DataUsageEndDate", "odrl:lteq", "2027-06-30");
    }

    @Test
    void policyToOdrl_wrapsSingleConstraintInOdrlOrForOr() throws Exception {
        Policy policy = createPolicy(
                List.of(frameworkAgreement()),
                LogicalOperator.OR
        );

        JsonNode or = constraintGroup(policy).path("odrl:or");

        assertEquals(1, or.size());
        assertAtomicConstraint(
                or.get(0),
                "FrameworkAgreement",
                "odrl:eq",
                "DataExchangeGovernance"
        );
    }

    @Test
    void policyToOdrl_omitsConstraintForOrWithoutConstraints() {
        Policy policy = createPolicy(List.of(), LogicalOperator.OR);

        JsonNode permission = mapToJson(policy)
                .path("policy")
                .path("odrl:permission")
                .path(0);

        assertFalse(permission.has("odrl:constraint"));
    }
}
