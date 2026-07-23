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
}
