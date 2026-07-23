
package org.constructx.policyhub.policies.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.constructx.policyhub.policies.api.dto.PolicyResponse;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlPolicyDefinitionResponse;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlPolicyResponse;
import org.constructx.policyhub.policies.application.PolicyService;
import org.constructx.policyhub.policies.domain.PolicyCategory;
import org.json.JSONArray;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PolicyController.class)
class PolicyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PolicyService policyService;

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void getAllPolicies_returnsOkWithPolicies() throws Exception {
        UUID id = UUID.fromString("00000000-0000-0000-0000-000000000001");
        ObjectMapper mapper = new ObjectMapper();
        JsonNode expectedNode = mapper.readTree("{\n" +
                "            \"odrl:leftOperand\": { \"@id\": \"https://w3id.org/catenax/2025/9/policy/Membership\" },\n" +
                "            \"odrl:operator\": { \"@id\": \"odrl:eq\" },\n" +
                "            \"odrl:rightOperand\": \"active\"\n" +
                "          }");
        JSONArray expectedConstraints = new JSONArray();
        expectedConstraints.put(expectedNode);
        when(policyService.getAllPolicies()).thenReturn(List.of(
                new PolicyResponse(id, "Example Policy", PolicyCategory.ACCESS, List.of(expectedNode), null, Instant.now(), Instant.now())
        ));

        mockMvc.perform(get("/api/v1/policies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(id.toString()))
                .andExpect(jsonPath("$[0].policyId").value("Example Policy"))
                .andExpect(jsonPath("$[0].constraints").isArray())
                .andExpect(jsonPath("$[0].constraints[0].odrl:rightOperand").value("active"))
                .andExpect(jsonPath("$[0].constraints[0].odrl:leftOperand.@id").value("https://w3id.org/catenax/2025/9/policy/Membership"))
                .andExpect(jsonPath("$[0].constraints[0].odrl:operator.@id").value("odrl:eq"));

    }

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void getOdrlPolicyDefinitionById_returnsOkWithOdrlPolicies() throws Exception {
        UUID uuid = UUID.fromString("00000000-0000-0000-0000-000000000001");
        
        OdrlPolicyResponse odrlPolicyResponse = new OdrlPolicyResponse(null, null, null, null, null);

        when(policyService.getOdrlPolicyDefinitionById(uuid)).thenReturn(
                new OdrlPolicyDefinitionResponse(null,  null, null, odrlPolicyResponse)
        );

        mockMvc.perform(get("/api/v1/policies/{id}/odrl", uuid))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.policy").exists());
    }

    @Test
    void getAllPolicies_withoutAuth_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/policies"))
                .andExpect(status().isUnauthorized());
    }
}

