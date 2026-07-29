package org.constructx.policyhub.policies.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.constructx.policyhub.policies.api.dto.CreatePolicyRequest;
import org.constructx.policyhub.policies.api.dto.PolicyResponse;
import org.constructx.policyhub.policies.api.dto.UpdatePolicyRequest;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlPolicyDefinitionResponse;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlPolicyResponse;
import org.constructx.policyhub.policies.application.PolicyNotFoundException;
import org.constructx.policyhub.policies.application.PolicyService;
import org.constructx.policyhub.policies.domain.PolicyCategory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PolicyController.class)
class PolicyControllerTest {

    private static final UUID POLICY_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000001");

    private static final Instant CREATED_AT =
            Instant.parse("2026-03-15T10:30:00Z");

    private static final Instant UPDATED_AT =
            Instant.parse("2026-04-29T09:40:00Z");

    private static final String CREATED_AT_STRING =
            "2026-03-15T10:30:00Z";

    private static final String UPDATED_AT_STRING =
            "2026-04-29T09:40:00Z";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private PolicyService policyService;

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void getAllPolicies_returnsOkWithPolicies() throws Exception {
        JsonNode constraint = membershipConstraint();

        when(policyService.getAllPolicies()).thenReturn(List.of(
                policyResponse(
                        """
                                zugriff-konsortium-mitglieder""",
                        PolicyCategory.ACCESS,
                        List.of(constraint)
                )
        ));

        mockMvc.perform(get("/api/v1/policies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(POLICY_ID.toString()))
                .andExpect(jsonPath("$[0].policyId")
                        .value("zugriff-konsortium-mitglieder"))
                .andExpect(jsonPath("$[0].category").value("ACCESS"))
                .andExpect(jsonPath("$[0].constraints").isArray())
                .andExpect(jsonPath("$[0].constraints[0].type")
                        .value("MEMBERSHIP"))
                .andExpect(jsonPath("$[0].constraints[0].value")
                        .value("active"))
                .andExpect(jsonPath("$[0].legalText")
                        .value("Der Zugriff ist aktiven Mitgliedern gestattet."))
                .andExpect(jsonPath("$[0].createdAt")
                        .value(CREATED_AT_STRING))
                .andExpect(jsonPath("$[0].updatedAt")
                        .value(UPDATED_AT_STRING));
    }

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void getPolicyById_returnsOkWithPolicy() throws Exception {
        when(policyService.getPolicyById(POLICY_ID)).thenReturn(
                policyResponse(
                        "zugriff-konsortium-mitglieder",
                        PolicyCategory.ACCESS,
                        List.of(membershipConstraint())
                )
        );

        mockMvc.perform(get("/api/v1/policies/{id}", POLICY_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(POLICY_ID.toString()))
                .andExpect(jsonPath("$.policyId")
                        .value("zugriff-konsortium-mitglieder"))
                .andExpect(jsonPath("$.category").value("ACCESS"))
                .andExpect(jsonPath("$.constraints[0].type")
                        .value("MEMBERSHIP"))
                .andExpect(jsonPath("$.constraints[0].value")
                        .value("active"))
                .andExpect(jsonPath("$.legalText")
                        .value("Der Zugriff ist aktiven Mitgliedern gestattet."));
    }

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void getPolicyById_whenPolicyDoesNotExist_returnsNotFound() throws Exception {
        when(policyService.getPolicyById(POLICY_ID))
                .thenThrow(new PolicyNotFoundException(POLICY_ID));

        mockMvc.perform(get("/api/v1/policies/{id}", POLICY_ID))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.path")
                        .value("/api/v1/policies/" + POLICY_ID));
    }

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void createPolicy_returnsCreatedPolicy() throws Exception {
        CreatePolicyRequest request = new CreatePolicyRequest(
                "zugriff-konsortium-mitglieder",
                PolicyCategory.ACCESS,
                List.of(membershipConstraint()),
                "Der Zugriff ist aktiven Mitgliedern gestattet."
        );

        when(policyService.createPolicy(eq(request))).thenReturn(
                policyResponse(
                        request.policyId(),
                        request.category(),
                        request.constraints()
                )
        );

        mockMvc.perform(post("/api/v1/policies")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(POLICY_ID.toString()))
                .andExpect(jsonPath("$.policyId")
                        .value("zugriff-konsortium-mitglieder"))
                .andExpect(jsonPath("$.category").value("ACCESS"))
                .andExpect(jsonPath("$.constraints[0].type")
                        .value("MEMBERSHIP"))
                .andExpect(jsonPath("$.constraints[0].value")
                        .value("active"))
                .andExpect(jsonPath("$.legalText")
                        .value("Der Zugriff ist aktiven Mitgliedern gestattet."));
    }

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void createPolicy_whenRequestIsIncomplete_returnsBadRequest() throws Exception {
        String requestBody = """
                {
                  "policyId": "",
                  "category": "ACCESS",
                  "constraints": [],
                  "legalText": ""
                }
                """;

        mockMvc.perform(post("/api/v1/policies")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.path").value("/api/v1/policies"));
    }

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void updatePolicy_returnsUpdatedPolicy() throws Exception {
        UpdatePolicyRequest request = new UpdatePolicyRequest(
                "zugriff-konsortium-mitglieder-updated",
                PolicyCategory.CONTRACT,
                List.of(useCaseConstraint()),
                "Aktualisierter juristischer Text."
        );

        PolicyResponse response = new PolicyResponse(
                POLICY_ID,
                request.policyId(),
                request.category(),
                request.constraints(),
                request.legalText(),
                CREATED_AT,
                UPDATED_AT
        );

        when(policyService.updatePolicy(eq(POLICY_ID), eq(request)))
                .thenReturn(response);

        mockMvc.perform(put("/api/v1/policies/{id}", POLICY_ID)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(POLICY_ID.toString()))
                .andExpect(jsonPath("$.policyId")
                        .value("zugriff-konsortium-mitglieder-updated"))
                .andExpect(jsonPath("$.category").value("CONTRACT"))
                .andExpect(jsonPath("$.constraints[0].type")
                        .value("USE_CASE"))
                .andExpect(jsonPath("$.constraints[0].useCases[0]")
                        .value("UC.quality-assurance"))
                .andExpect(jsonPath("$.legalText")
                        .value("Aktualisierter juristischer Text."));
    }

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void deletePolicy_returnsNoContent() throws Exception {
        doNothing().when(policyService).deletePolicy(POLICY_ID);

        mockMvc.perform(delete("/api/v1/policies/{id}", POLICY_ID)
                        .with(csrf()))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));

        verify(policyService).deletePolicy(POLICY_ID);
    }

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void getOdrlPolicyDefinitionById_returnsOkWithOdrlPolicy()
            throws Exception {
        OdrlPolicyResponse odrlPolicyResponse =
                new OdrlPolicyResponse(null, null, null, null, null);

        when(policyService.getOdrlPolicyDefinitionById(POLICY_ID))
                .thenReturn(
                        new OdrlPolicyDefinitionResponse(
                                null,
                                null,
                                null,
                                odrlPolicyResponse
                        )
                );

        mockMvc.perform(
                        get("/api/v1/policies/{id}/odrl", POLICY_ID)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.policy").exists());
    }

    @Test
    void getAllPolicies_withoutAuth_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/policies"))
                .andExpect(status().isUnauthorized());
    }

    private PolicyResponse policyResponse(
            String policyId,
            PolicyCategory category,
            List<JsonNode> constraints
    ) {
        return new PolicyResponse(
                POLICY_ID,
                policyId,
                category,
                constraints,
                "Der Zugriff ist aktiven Mitgliedern gestattet.",
                CREATED_AT,
                UPDATED_AT
        );
    }

    private JsonNode membershipConstraint() throws Exception {
        return objectMapper.readTree("""
                {
                  "type": "MEMBERSHIP",
                  "value": "active"
                }
                """);
    }

    private JsonNode useCaseConstraint() throws Exception {
        return objectMapper.readTree("""
                {
                  "type": "USE_CASE",
                  "useCases": [
                    "UC.quality-assurance"
                  ]
                }
                """);
    }
}