package org.constructx.policyhub.policies.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * End-to-end check of the DATE_RANGE start-date rule over HTTP and the real database: a start
 * date in the past is rejected on create, but on update an unchanged stored start date stays
 * valid, so that a running period can be extended by changing only its end date.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@WithMockUser
class PolicyDateRangeIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    private static final LocalDate TODAY = LocalDate.now();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void createPolicy_withStartDateInPast_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/v1/policies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(policyJson(
                                "con-x-ph-it-create-past-start",
                                TODAY.minusDays(1),
                                TODAY.plusMonths(1)
                        )))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message")
                        .value("constraints[0].startDate must not be in the past"));
    }

    @Test
    void updatePolicy_keepingStoredPastStartDate_extendsEndDate() throws Exception {
        LocalDate storedStart = TODAY.minusMonths(3);
        LocalDate newEnd = TODAY.plusYears(1);
        UUID id = insertRunningPolicy("con-x-ph-it-extend-end", storedStart);

        mockMvc.perform(put("/api/v1/policies/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(policyJson("con-x-ph-it-extend-end", storedStart, newEnd)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.constraints[0].startDate").value(storedStart.toString()))
                .andExpect(jsonPath("$.constraints[0].endDate").value(newEnd.toString()));

        // Persisted, not just echoed back.
        mockMvc.perform(get("/api/v1/policies/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.constraints[0].startDate").value(storedStart.toString()))
                .andExpect(jsonPath("$.constraints[0].endDate").value(newEnd.toString()));
    }

    @Test
    void updatePolicy_changingStartDateToOtherPastDate_returnsBadRequest() throws Exception {
        UUID id = insertRunningPolicy("con-x-ph-it-other-past-start", TODAY.minusMonths(3));

        mockMvc.perform(put("/api/v1/policies/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(policyJson(
                                "con-x-ph-it-other-past-start",
                                TODAY.minusMonths(2),
                                TODAY.plusMonths(1)
                        )))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message")
                        .value("constraints[0].startDate must not be in the past"));
    }

    @Test
    void updatePolicy_changingStartDateToFutureDate_isAccepted() throws Exception {
        LocalDate newStart = TODAY.plusDays(1);
        UUID id = insertRunningPolicy("con-x-ph-it-future-start", TODAY.minusMonths(3));

        mockMvc.perform(put("/api/v1/policies/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(policyJson(
                                "con-x-ph-it-future-start",
                                newStart,
                                TODAY.plusMonths(2)
                        )))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.constraints[0].startDate").value(newStart.toString()));
    }

    /**
     * Inserts a policy whose period is already running (start date in the past). Done directly
     * via SQL, because the API rightly refuses to create such a policy.
     */
    private UUID insertRunningPolicy(String policyId, LocalDate startDate) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO policies (id, policy_id, category, constraints, legal_text,"
                        + " created_at, updated_at)"
                        + " VALUES (?, ?, 'CONTRACT', ?::jsonb, 'Rechtstext', now(), now())",
                id,
                policyId,
                "[" + dateRangeJson(startDate, TODAY.plusMonths(1)) + "]"
        );
        return id;
    }

    private static String policyJson(String policyId, LocalDate startDate, LocalDate endDate) {
        return """
                {
                  "policyId": "%s",
                  "category": "CONTRACT",
                  "constraints": [%s],
                  "logicalOperator": "AND",
                  "legalText": "Rechtstext"
                }
                """.formatted(policyId, dateRangeJson(startDate, endDate));
    }

    private static String dateRangeJson(LocalDate startDate, LocalDate endDate) {
        return """
                { "type": "DATE_RANGE", "startDate": "%s", "endDate": "%s" }
                """.formatted(startDate, endDate).strip();
    }
}
