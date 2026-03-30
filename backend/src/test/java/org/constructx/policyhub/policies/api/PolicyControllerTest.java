package org.constructx.policyhub.policies.api;

import org.constructx.policyhub.policies.application.PolicyService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PolicyController.class)
class PolicyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @TestConfiguration
    static class TestConfig {
        @Bean
        public PolicyService policyService() {
            return new PolicyService();
        }
    }

    @Test
    @WithMockUser(username = "admin", roles = "USER")
    void getAllPolicies_returnsOkWithPolicies() throws Exception {
        mockMvc.perform(get("/api/v1/policies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("skeleton-1"))
                .andExpect(jsonPath("$[0].name").value("Example Policy"))
                .andExpect(jsonPath("$[0].status").value("DRAFT"));
    }

    @Test
    void getAllPolicies_withoutAuth_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/policies"))
                .andExpect(status().isUnauthorized());
    }
}
