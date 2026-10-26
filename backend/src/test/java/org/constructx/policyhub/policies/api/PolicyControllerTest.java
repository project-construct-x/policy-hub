package org.constructx.policyhub.policies.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.constructx.policyhub.policies.api.dto.CreatePolicyRequest;
import org.constructx.policyhub.policies.api.dto.PolicyResponse;
import org.constructx.policyhub.policies.api.dto.UpdatePolicyRequest;
import org.constructx.policyhub.policies.application.InvalidPolicyException;
import org.constructx.policyhub.policies.application.PolicyNotFoundException;
import org.constructx.policyhub.policies.application.PolicyService;
import org.constructx.policyhub.policies.application.odrl.OdrlPolicyMapper;
import org.constructx.policyhub.policies.domain.LogicalOperator;
import org.constructx.policyhub.policies.domain.Policy;
import org.constructx.policyhub.policies.domain.PolicyCategory;
import org.constructx.policyhub.policies.domain.PolicyId;
import org.constructx.policyhub.policies.infrastructure.PolicyEntity;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.mapping.PropertyReferenceException;
import org.springframework.data.util.TypeInformation;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.skyscreamer.jsonassert.JSONAssert;
import org.skyscreamer.jsonassert.JSONCompareMode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

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
            "con-x-ph-zugriff-konsortium-mitglieder",
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
                    .value("con-x-ph-zugriff-konsortium-mitglieder"))
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
    void getAllPolicies_withoutParams_usesDefaultPageAndSort() throws Exception {
        when(policyService.getAllPolicies(any(Pageable.class)))
                .thenReturn(Page.empty());

        mockMvc.perform(get("/api/v1/policies"))
                .andExpect(status().isOk());

        verify(policyService).getAllPolicies(
                PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "updatedAt"))
        );
    }

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void getPolicyById_returnsOkWithPolicy() throws Exception {
        when(policyService.getPolicyById(POLICY_ID)).thenReturn(
                policyResponse(
                        "con-x-ph-zugriff-konsortium-mitglieder",
                        PolicyCategory.ACCESS,
                        List.of(membershipConstraint())
                )
        );

        mockMvc.perform(get("/api/v1/policies/{id}", POLICY_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(POLICY_ID.toString()))
                .andExpect(jsonPath("$.policyId")
                        .value("con-x-ph-zugriff-konsortium-mitglieder"))
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
                "con-x-ph-zugriff-konsortium-mitglieder",
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
                        .value("con-x-ph-zugriff-konsortium-mitglieder"))
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
                "con-x-ph-zugriff-konsortium-mitglieder-updated",
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
                        .value("con-x-ph-zugriff-konsortium-mitglieder-updated"))
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
    void getOdrlPolicyDefinitionById_serializesConnectorReadyJsonLd()
            throws Exception {
        Policy policy = new Policy(
                POLICY_ID,
                "nutzung-konsortium-2027",
                PolicyCategory.CONTRACT,
                List.of(
                        membershipConstraint(),
                        objectMapper.readTree("""
                            {
                              "type": "FRAMEWORK_AGREEMENT",
                              "agreement": "DataExchangeGovernance"
                            }
                            """),
                        dateRangeConstraint()
                ),
                LogicalOperator.AND,
                "Rechtstext",
                CREATED_AT,
                UPDATED_AT
        );

        when(policyService.getOdrlPolicyDefinitionById(POLICY_ID))
                .thenReturn(new OdrlPolicyMapper().policyToOdrl(policy));

        String actual = mockMvc.perform(
                        get("/api/v1/policies/{id}/odrl", POLICY_ID)
                )
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String expected = """
            {
              "@context": {
                "@vocab": "https://w3id.org/edc/v0.0.1/ns/",
                "edc": "https://w3id.org/edc/v0.0.1/ns/",
                "odrl": "http://www.w3.org/ns/odrl/2/"
              },
              "@type": "PolicyDefinition",
              "@id": "nutzung-konsortium-2027",
              "policy": {
                "@context": "http://www.w3.org/ns/odrl.jsonld",
                "@type": "Set",
                "odrl:permission": [
                  {
                    "odrl:action": { "@id": "odrl:use" },
                    "odrl:constraint": {
                      "odrl:and": [
                        {
                          "odrl:leftOperand": { "@id": "https://w3id.org/catenax/2025/9/policy/Membership" },
                          "odrl:operator": { "@id": "odrl:eq" },
                          "odrl:rightOperand": "active"
                        },
                        {
                          "odrl:leftOperand": { "@id": "https://w3id.org/catenax/2025/9/policy/FrameworkAgreement" },
                          "odrl:operator": { "@id": "odrl:eq" },
                          "odrl:rightOperand": "DataExchangeGovernance"
                        },
                        {
                          "odrl:leftOperand": { "@id": "https://w3id.org/catenax/2025/9/policy/DataUsageStartDate" },
                          "odrl:operator": { "@id": "odrl:gteq" },
                          "odrl:rightOperand": "2026-08-01"
                        },
                        {
                          "odrl:leftOperand": { "@id": "https://w3id.org/catenax/2025/9/policy/DataUsageEndDate" },
                          "odrl:operator": { "@id": "odrl:lteq" },
                          "odrl:rightOperand": "2027-12-31"
                        }
                      ]
                    }
                  }
                ],
                "odrl:prohibition": [],
                "odrl:obligation": []
              }
            }
            """;

        JSONAssert.assertEquals(expected, actual, JSONCompareMode.STRICT);
    }

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void getOdrlPolicyDefinitionById_withUnknownConstraintType_returnsUnprocessableEntity()
            throws Exception {
        Policy policy = new Policy(
                POLICY_ID,
                "con-x-ph-altbestand",
                PolicyCategory.ACCESS,
                List.of(
                        membershipConstraint(),
                        objectMapper.readTree("""
                                { "type": "GIBTS_NICHT", "value": "x" }
                                """)
                ),
                LogicalOperator.AND,
                "Rechtstext",
                CREATED_AT,
                UPDATED_AT
        );

        when(policyService.getOdrlPolicyDefinitionById(POLICY_ID))
                .thenAnswer(invocation -> new OdrlPolicyMapper().policyToOdrl(policy));

        mockMvc.perform(get("/api/v1/policies/{id}/odrl", POLICY_ID))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.status").value(422))
                .andExpect(jsonPath("$.error").value("Unprocessable Entity"))
                .andExpect(jsonPath("$.message").value(
                        "Policy con-x-ph-altbestand contains unsupported constraint type "
                                + "'GIBTS_NICHT'; ODRL export is not possible"))
                .andExpect(jsonPath("$.path").value("/api/v1/policies/" + POLICY_ID + "/odrl"));
    }

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void createPolicy_withDateRange_returnsCreatedPolicy() throws Exception {
        JsonNode dateRange = dateRangeConstraint();

        CreatePolicyRequest request = new CreatePolicyRequest(
                "con-x-ph-zugriff-im-zeitraum",
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
    @WithMockUser(username = "admin", roles = "USER")
    void createPolicy_withParticipantDid_returnsCreatedPolicy() throws Exception {
        JsonNode participantDid = objectMapper.readTree("""
                {
                  "type": "PARTICIPANT_DID",
                  "dids": ["did:web:a.example", "did:web:b.example"]
                }
                """);

        CreatePolicyRequest request = new CreatePolicyRequest(
                "con-x-ph-zugriff-teilnehmer",
                PolicyCategory.ACCESS,
                List.of(participantDid),
                LogicalOperator.AND,
                "Der Zugriff ist nur den angegebenen Teilnehmern gestattet."
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
                        .value("PARTICIPANT_DID"))
                .andExpect(jsonPath("$.constraints[0].dids[0]")
                        .value("did:web:a.example"))
                .andExpect(jsonPath("$.constraints[0].dids[1]")
                        .value("did:web:b.example"));
    }

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void createPolicy_withInvalidParticipantDid_returnsBadRequest() throws Exception {
        String requestBody = """
                {
                  "policyId": "con-x-ph-zugriff-teilnehmer",
                  "category": "ACCESS",
                  "constraints": [
                    { "type": "PARTICIPANT_DID", "dids": ["did:key:z6Mkabc"] }
                  ],
                  "legalText": "Der Zugriff ist nur den angegebenen Teilnehmern gestattet."
                }
                """;

        when(policyService.createPolicy(any(CreatePolicyRequest.class)))
                .thenThrow(new InvalidPolicyException(
                        "constraints[0].dids[0] must be a valid did:web identifier"
                ));

        mockMvc.perform(post("/api/v1/policies")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(
                        "constraints[0].dids[0] must be a valid did:web identifier"));
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
                  "policyId": "con-x-ph-mitglied-oder-rahmenvertrag",
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
                        "con-x-ph-mitglied-oder-rahmenvertrag",
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
                  "policyId": "con-x-ph-zugriff-konsortium-mitglieder",
                  "category": "ACCESS",
                  "constraints": [{ "type": "MEMBERSHIP", "value": "active" }],
                  "legalText": "Der Zugriff ist aktiven Mitgliedern gestattet."
                }
                """;

        when(policyService.createPolicy(any(CreatePolicyRequest.class))).thenReturn(
                policyResponse(
                        "con-x-ph-zugriff-konsortium-mitglieder",
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
                  "policyId": "con-x-ph-zugriff-konsortium-mitglieder",
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
    void updatePolicy_withUnknownId_returnsNotFound() throws Exception {
        when(policyService.updatePolicy(eq(POLICY_ID), any(UpdatePolicyRequest.class)))
                .thenThrow(new PolicyNotFoundException(POLICY_ID));

        mockMvc.perform(put("/api/v1/policies/{id}", POLICY_ID)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateRequestJson("con-x-ph-zugriff-konsortium-mitglieder")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.path").value("/api/v1/policies/" + POLICY_ID));
    }

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void updatePolicy_withOrLogicalOperator_passesItThrough() throws Exception {
        UpdatePolicyRequest request = new UpdatePolicyRequest(
                "con-x-ph-zugriff-konsortium-mitglieder",
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
    void getPolicyById_withInvalidUuid_returnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/v1/policies/{id}", "not-a-uuid"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message")
                        .value("Invalid value 'not-a-uuid' for parameter 'id'"))
                .andExpect(jsonPath("$.path").value("/api/v1/policies/not-a-uuid"));
    }

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void patchPolicy_returnsMethodNotAllowedWithAllowHeader() throws Exception {
        mockMvc.perform(patch("/api/v1/policies/{id}", POLICY_ID)
                        .with(csrf()))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(header().string("Allow", allOf(
                        containsString("GET"),
                        containsString("PUT"),
                        containsString("DELETE"))))
                .andExpect(jsonPath("$.status").value(405))
                .andExpect(jsonPath("$.error").value("Method Not Allowed"))
                .andExpect(jsonPath("$.message")
                        .value("Method 'PATCH' is not supported for this endpoint"))
                .andExpect(jsonPath("$.path").value("/api/v1/policies/" + POLICY_ID));
    }

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void getAllPolicies_withUnknownSortProperty_returnsBadRequest() throws Exception {
        when(policyService.getAllPolicies(any(Pageable.class)))
                .thenThrow(new PropertyReferenceException(
                        "gibtsNicht",
                        TypeInformation.of(PolicyEntity.class),
                        List.of()
                ));

        mockMvc.perform(get("/api/v1/policies").param("sort", "gibtsNicht,asc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Unknown sort property 'gibtsNicht'"))
                .andExpect(jsonPath("$.path").value("/api/v1/policies"));
    }

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void createPolicy_withConcurrentDuplicatePolicyId_returnsConflict() throws Exception {
        when(policyService.createPolicy(any(CreatePolicyRequest.class)))
                .thenThrow(dataIntegrityViolation("uk_policies_policy_id"));

        mockMvc.perform(post("/api/v1/policies")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validCreateRequestJson()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message")
                        .value("A policy with this policyId already exists"))
                .andExpect(jsonPath("$.path").value("/api/v1/policies"));
    }

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void createPolicy_withOtherIntegrityViolation_returnsInternalServerError() throws Exception {
        when(policyService.createPolicy(any(CreatePolicyRequest.class)))
                .thenThrow(dataIntegrityViolation("chk_policies_logical_operator"));

        mockMvc.perform(post("/api/v1/policies")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validCreateRequestJson()))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.error").value("Internal Server Error"))
                .andExpect(jsonPath("$.message").value("An unexpected error occurred"));
    }

    private static DataIntegrityViolationException dataIntegrityViolation(String constraintName) {
        return new DataIntegrityViolationException(
                "could not execute statement",
                new ConstraintViolationException(
                        "could not execute statement",
                        new SQLException("violates constraint " + constraintName),
                        constraintName
                )
        );
    }

    private String validCreateRequestJson() throws Exception {
        return objectMapper.writeValueAsString(new CreatePolicyRequest(
                "con-x-ph-concurrent-duplicate",
                PolicyCategory.ACCESS,
                List.of(membershipConstraint()),
                LogicalOperator.AND,
                "Rechtstext"
        ));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "con-x-ph-a",
            "con-x-ph-7",
            "con-x-ph-zugriff-konsortium-mitglieder",
            "con-x-ph-policy.use-case_quality-assurance",
            "con-x-ph-Policy.V2"
    })
    @WithMockUser(username = "admin", roles = "USER")
    void createPolicy_withValidPolicyId_isAccepted(String policyId) throws Exception {
        when(policyService.createPolicy(any(CreatePolicyRequest.class))).thenReturn(
                policyResponse(policyId, PolicyCategory.ACCESS, List.of(membershipConstraint()))
        );

        mockMvc.perform(post("/api/v1/policies")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createRequestJson(policyId)))
                .andExpect(status().isCreated());
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "https://evil.example/policy",
            "_:b0",
            "con-x-ph-x:evil",
            "con-x-ph-with space",
            " con-x-ph-policy-1",
            "con-x-ph-policy-1 ",
            "con-x-ph-policy/1",
            "con-x-ph-policy#1",
            "con-x-ph-umlaut-ä"
    })
    @WithMockUser(username = "admin", roles = "USER")
    void createPolicy_withInvalidPolicyId_returnsBadRequest(String policyId) throws Exception {
        mockMvc.perform(post("/api/v1/policies")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createRequestJson(policyId)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString(PolicyId.PATTERN_MESSAGE)));

        verify(policyService, never()).createPolicy(any());
    }

    @ParameterizedTest
    @ValueSource(strings = {"con-x-ph-zugriff-konsortium-mitglieder", "con-x-ph-policy.use-case_quality-assurance"})
    @WithMockUser(username = "admin", roles = "USER")
    void updatePolicy_withValidPolicyId_isAccepted(String policyId) throws Exception {
        when(policyService.updatePolicy(eq(POLICY_ID), any(UpdatePolicyRequest.class))).thenReturn(
                policyResponse(policyId, PolicyCategory.ACCESS, List.of(membershipConstraint()))
        );

        mockMvc.perform(put("/api/v1/policies/{id}", POLICY_ID)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateRequestJson(policyId)))
                .andExpect(status().isOk());
    }

    @ParameterizedTest
    @ValueSource(strings = {"https://evil.example/policy", "_:b0", "con-x-ph-x:evil", "con-x-ph-policy-1 "})
    @WithMockUser(username = "admin", roles = "USER")
    void updatePolicy_withInvalidPolicyId_returnsBadRequest(String policyId) throws Exception {
        mockMvc.perform(put("/api/v1/policies/{id}", POLICY_ID)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateRequestJson(policyId)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString(PolicyId.PATTERN_MESSAGE)));

        verify(policyService, never()).updatePolicy(any(), any());
    }

    private String createRequestJson(String policyId) throws Exception {
        return objectMapper.writeValueAsString(new CreatePolicyRequest(
                policyId,
                PolicyCategory.ACCESS,
                List.of(membershipConstraint()),
                LogicalOperator.AND,
                "Rechtstext"
        ));
    }

    private String updateRequestJson(String policyId) throws Exception {
        return objectMapper.writeValueAsString(new UpdatePolicyRequest(
                policyId,
                PolicyCategory.ACCESS,
                List.of(membershipConstraint()),
                LogicalOperator.AND,
                "Rechtstext"
        ));
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
                  "policyId": "con-x-ph-",
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
