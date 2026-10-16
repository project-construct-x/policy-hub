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
import org.constructx.policyhub.policies.domain.LogicalOperator;
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

import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verifyNoInteractions;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import static org.mockito.ArgumentMatchers.any;

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

        PolicyResponse response = policyResponse(
            "con-x-policyHub-zugriff-konsortium-mitglieder",
            PolicyCategory.ACCESS,
            List.of(constraint)
        );

        Page<PolicyResponse> page = new PageImpl<>(
            List.of(response),
            PageRequest.of(0, 20),
            1
        );

        when(policyService.getAllPolicies(any(Pageable.class)))
            .thenReturn(page);

        mockMvc.perform(get("/api/v1/policies")
                    .param("page", "0")
                    .param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].id")
                    .value(POLICY_ID.toString()))
            .andExpect(jsonPath("$.content[0].policyId")
                    .value("con-x-policyHub-zugriff-konsortium-mitglieder"))
            .andExpect(jsonPath("$.content[0].category")
                    .value("ACCESS"))
            .andExpect(jsonPath("$.content[0].constraints").isArray())
            .andExpect(jsonPath("$.content[0].constraints[0].type")
                    .value("MEMBERSHIP"))
            .andExpect(jsonPath("$.content[0].constraints[0].value")
                    .value("active"))
            .andExpect(jsonPath("$.content[0].legalText")
                    .value("Der Zugriff ist aktiven Mitgliedern gestattet."))
            .andExpect(jsonPath("$.content[0].createdAt")
                    .value(CREATED_AT_STRING))
            .andExpect(jsonPath("$.content[0].updatedAt")
                    .value(UPDATED_AT_STRING))
            .andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.totalPages").value(1))
            .andExpect(jsonPath("$.size").value(20))
            .andExpect(jsonPath("$.number").value(0));
    }

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void getAllPolicies_passesPaginationToService() throws Exception {
        when(policyService.getAllPolicies(any(Pageable.class)))
                .thenReturn(Page.empty());

        mockMvc.perform(get("/api/v1/policies")
                        .param("page", "2")
                        .param("size", "5"))
                .andExpect(status().isOk());

        verify(policyService).getAllPolicies(
                argThat(pageable ->
                        pageable.getPageNumber() == 2
                                && pageable.getPageSize() == 5
                )
        );
    }

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void getPolicyById_returnsOkWithPolicy() throws Exception {
        when(policyService.getPolicyById(POLICY_ID)).thenReturn(
                policyResponse(
                        "con-x-policyHub-zugriff-konsortium-mitglieder",
                        PolicyCategory.ACCESS,
                        List.of(membershipConstraint())
                )
        );

        mockMvc.perform(get("/api/v1/policies/{id}", POLICY_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(POLICY_ID.toString()))
                .andExpect(jsonPath("$.policyId")
                        .value("con-x-policyHub-zugriff-konsortium-mitglieder"))
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
                "con-x-policyHub-zugriff-konsortium-mitglieder",
                PolicyCategory.ACCESS,
                List.of(membershipConstraint()),
                LogicalOperator.AND,
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
                        .value("con-x-policyHub-zugriff-konsortium-mitglieder"))
                .andExpect(jsonPath("$.category").value("ACCESS"))
                .andExpect(jsonPath("$.constraints[0].type")
                        .value("MEMBERSHIP"))
                .andExpect(jsonPath("$.constraints[0].value")
                        .value("active"))
                .andExpect(jsonPath("$.logicalOperator").value("AND"))
                .andExpect(jsonPath("$.legalText")
                        .value("Der Zugriff ist aktiven Mitgliedern gestattet."));
    }

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void createPolicy_whenPolicyIdLacksHubPrefix_returnsBadRequest() throws Exception {
        String requestBody = """
                {
                  "policyId": "zugriff-konsortium-mitglieder",
                  "category": "ACCESS",
                  "constraints": [],
                  "legalText": "Der Zugriff ist gestattet."
                }
                """;

        mockMvc.perform(post("/api/v1/policies")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
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
                "con-x-policyHub-zugriff-konsortium-mitglieder-updated",
                PolicyCategory.CONTRACT,
                List.of(frameworkAgreementConstraint()),
                LogicalOperator.AND,
                "Aktualisierter juristischer Text."
        );

        PolicyResponse response = new PolicyResponse(
                POLICY_ID,
                request.policyId(),
                request.category(),
                request.constraints(),
                LogicalOperator.AND,
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
                        .value("con-x-policyHub-zugriff-konsortium-mitglieder-updated"))
                .andExpect(jsonPath("$.category").value("CONTRACT"))
                .andExpect(jsonPath("$.constraints[0].type")
                        .value("FRAMEWORK_AGREEMENT"))
                .andExpect(jsonPath("$.constraints[0].agreement")
                        .value("DataExchangeGovernance"))
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
    @WithMockUser(username = "admin", roles = "USER")
    void createPolicy_withDateRange_returnsCreatedPolicy() throws Exception {
        JsonNode dateRange = dateRangeConstraint();

        CreatePolicyRequest request = new CreatePolicyRequest(
                "con-x-policyHub-zugriff-im-zeitraum",
                PolicyCategory.ACCESS,
                List.of(dateRange),
                LogicalOperator.AND,
                "Der Zugriff ist im angegebenen Zeitraum gestattet."
        );

        PolicyResponse response = new PolicyResponse(
                POLICY_ID,
                request.policyId(),
                request.category(),
                request.constraints(),
                LogicalOperator.AND,
                request.legalText(),
                CREATED_AT,
                UPDATED_AT
        );

        when(policyService.createPolicy(eq(request)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/policies")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.constraints[0].type")
                        .value("DATE_RANGE"))
                .andExpect(jsonPath("$.constraints[0].startDate")
                        .value("2026-08-01"))
                .andExpect(jsonPath("$.constraints[0].endDate")
                        .value("2027-12-31"));
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
                LogicalOperator.AND,
                "Der Zugriff ist aktiven Mitgliedern gestattet.",
                CREATED_AT,
                UPDATED_AT
        );
    }

    private JsonNode dateRangeConstraint() throws Exception {
        return objectMapper.readTree("""
            {
              "type": "DATE_RANGE",
              "startDate": "2026-08-01",
              "endDate": "2027-12-31"
            }
            """);
    }

    private JsonNode membershipConstraint() throws Exception {
        return objectMapper.readTree("""
                {
                  "type": "MEMBERSHIP",
                  "value": "active"
                }
                """);
    }

    private JsonNode frameworkAgreementConstraint() throws Exception {
        return objectMapper.readTree("""
                {
                  "type": "FRAMEWORK_AGREEMENT",
                  "agreement": "DataExchangeGovernance"
                }
                """);
    }

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void createPolicy_withOrLogicalOperator_passesItThroughAndReturnsIt() throws Exception {
        String requestBody = """
                {
                  "policyId": "con-x-policyHub-mitglied-oder-rahmenvertrag",
                  "category": "ACCESS",
                  "constraints": [
                    { "type": "MEMBERSHIP", "value": "active" },
                    { "type": "FRAMEWORK_AGREEMENT", "agreement": "DataExchangeGovernance" }
                  ],
                  "logicalOperator": "OR",
                  "legalText": "Der Zugriff ist gestattet, sofern mindestens eine Voraussetzung erfüllt ist."
                }
                """;

        when(policyService.createPolicy(any(CreatePolicyRequest.class))).thenReturn(
                new PolicyResponse(
                        POLICY_ID,
                        "con-x-policyHub-mitglied-oder-rahmenvertrag",
                        PolicyCategory.ACCESS,
                        List.of(membershipConstraint(), frameworkAgreementConstraint()),
                        LogicalOperator.OR,
                        "Der Zugriff ist gestattet, sofern mindestens eine Voraussetzung erfüllt ist.",
                        CREATED_AT,
                        UPDATED_AT
                )
        );

        mockMvc.perform(post("/api/v1/policies")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.logicalOperator").value("OR"));

        verify(policyService).createPolicy(
                argThat(request -> request.logicalOperator() == LogicalOperator.OR)
        );
    }

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void createPolicy_withoutLogicalOperator_isAccepted() throws Exception {
        String requestBody = """
                {
                  "policyId": "con-x-policyHub-zugriff-konsortium-mitglieder",
                  "category": "ACCESS",
                  "constraints": [{ "type": "MEMBERSHIP", "value": "active" }],
                  "legalText": "Der Zugriff ist aktiven Mitgliedern gestattet."
                }
                """;

        when(policyService.createPolicy(any(CreatePolicyRequest.class))).thenReturn(
                policyResponse(
                        "con-x-policyHub-zugriff-konsortium-mitglieder",
                        PolicyCategory.ACCESS,
                        List.of(membershipConstraint())
                )
        );

        mockMvc.perform(post("/api/v1/policies")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.logicalOperator").value("AND"));

        // The default (AND) is applied in the service, not during deserialization.
        verify(policyService).createPolicy(
                argThat(request -> request.logicalOperator() == null)
        );
    }

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void createPolicy_withUnknownLogicalOperator_returnsBadRequest() throws Exception {
        String requestBody = """
                {
                  "policyId": "con-x-policyHub-zugriff-konsortium-mitglieder",
                  "category": "ACCESS",
                  "constraints": [{ "type": "MEMBERSHIP", "value": "active" }],
                  "logicalOperator": "XOR",
                  "legalText": "Der Zugriff ist aktiven Mitgliedern gestattet."
                }
                """;

        mockMvc.perform(post("/api/v1/policies")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void updatePolicy_withOrLogicalOperator_passesItThrough() throws Exception {
        UpdatePolicyRequest request = new UpdatePolicyRequest(
                "con-x-policyHub-zugriff-konsortium-mitglieder",
                PolicyCategory.ACCESS,
                List.of(membershipConstraint(), frameworkAgreementConstraint()),
                LogicalOperator.OR,
                "Der Zugriff ist gestattet, sofern mindestens eine Voraussetzung erfüllt ist."
        );

        when(policyService.updatePolicy(eq(POLICY_ID), eq(request))).thenReturn(
                new PolicyResponse(
                        POLICY_ID,
                        request.policyId(),
                        request.category(),
                        request.constraints(),
                        request.logicalOperator(),
                        request.legalText(),
                        CREATED_AT,
                        UPDATED_AT
                )
        );

        mockMvc.perform(put("/api/v1/policies/{id}", POLICY_ID)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.logicalOperator").value("OR"));
    }

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void updatePolicy_whenPolicyIdLacksHubPrefix_returnsBadRequest() throws Exception {
        UpdatePolicyRequest request = new UpdatePolicyRequest(
                "zugriff-konsortium-mitglieder",
                PolicyCategory.ACCESS,
                List.of(membershipConstraint()),
                LogicalOperator.AND,
                "Der Zugriff ist aktiven Mitgliedern gestattet."
        );

        mockMvc.perform(put("/api/v1/policies/{id}", POLICY_ID)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        verifyNoInteractions(policyService);
    }

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void createPolicy_whenPolicyIdIsOnlyThePrefix_returnsBadRequest() throws Exception {
        String requestBody = """
                {
                  "policyId": "con-x-policyHub-",
                  "category": "ACCESS",
                  "constraints": [],
                  "legalText": "Der Zugriff ist gestattet."
                }
                """;

        mockMvc.perform(post("/api/v1/policies")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }
}
