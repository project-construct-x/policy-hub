package org.constructx.policyhub.policies.api;

import org.constructx.policyhub.policies.api.dto.PolicyResponse;
import org.constructx.policyhub.policies.application.PolicyService;
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
        when(policyService.getAllPolicies()).thenReturn(List.of(
                new PolicyResponse(id, "Example Policy", "A test policy", "DRAFT", null, Instant.now(), Instant.now())
        ));

        mockMvc.perform(get("/api/v1/policies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(id.toString()))
                .andExpect(jsonPath("$[0].name").value("Example Policy"))
                .andExpect(jsonPath("$[0].status").value("DRAFT"));
    }

    @Test
    void getAllPolicies_withoutAuth_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/policies"))
                .andExpect(status().isUnauthorized());
    }
}

