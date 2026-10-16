package org.constructx.policyhub.policies.infrastructure;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;
import java.util.UUID;

import org.constructx.policyhub.policies.domain.LogicalOperator;
import org.constructx.policyhub.policies.domain.PolicyCategory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.EntityManager;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class PolicyRepositoryIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private PolicyRepository policyRepository;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void save_roundTripsConstraintsThroughJsonb() throws Exception {
        List<JsonNode> constraints = List.of(
                objectMapper.readTree("""
                    { "type": "MEMBERSHIP", "value": "active" }
                    """),
                objectMapper.readTree("""
                    { "type": "FRAMEWORK_AGREEMENT", "agreement": "DataExchangeGovernance" }
                    """),
                objectMapper.readTree("""
                    { "type": "DATE_RANGE", "startDate": "2027-01-01", "endDate": "2027-06-30" }
                    """)
        );

        UUID id = persist("jsonb-roundtrip", PolicyCategory.CONTRACT, constraints, LogicalOperator.AND);

        PolicyEntity reloaded = policyRepository.findById(id).orElseThrow();

        assertEquals(constraints, reloaded.getConstraints());
        assertEquals("2027-01-01", reloaded.getConstraints().get(2).get("startDate").textValue());
    }

    @Test
    void save_storesEnumsAsText() {
        UUID id = persist("enums-as-text", PolicyCategory.ACCESS, List.of(), LogicalOperator.OR);

        PolicyEntity reloaded = policyRepository.findById(id).orElseThrow();

        assertEquals(PolicyCategory.ACCESS, reloaded.getCategory());
        assertEquals(LogicalOperator.OR, reloaded.getLogicalOperator());
        assertEquals("ACCESS", rawColumn(id, "category"));
        assertEquals("OR", rawColumn(id, "logical_operator"));
    }

    @Test
    void logicalOperator_defaultsToAndForRowsWithoutValue() {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO policies (id, policy_id, category, legal_text) VALUES (?, ?, ?, ?)",
                id, "legacy-row", "CONTRACT", "Rechtstext"
        );

        PolicyEntity reloaded = policyRepository.findById(id).orElseThrow();

        assertEquals(LogicalOperator.AND, reloaded.getLogicalOperator());
    }

    @Test
    void logicalOperator_rejectsUnknownValues() {
        assertThrows(
                DataIntegrityViolationException.class,
                () -> jdbcTemplate.update(
                        "INSERT INTO policies (id, policy_id, category, legal_text, logical_operator)"
                                + " VALUES (?, ?, ?, ?, ?)",
                        UUID.randomUUID(), "invalid-operator", "CONTRACT", "Rechtstext", "XOR"
                )
        );
    }

    private UUID persist(
            String policyId,
            PolicyCategory category,
            List<JsonNode> constraints,
            LogicalOperator logicalOperator
    ) {
        PolicyEntity entity = new PolicyEntity();
        entity.setPolicyId(policyId);
        entity.setCategory(category);
        entity.setConstraints(constraints);
        entity.setLogicalOperator(logicalOperator);
        entity.setLegalText("Rechtstext");

        UUID id = policyRepository.saveAndFlush(entity).getId();
        // Forces the reload to hit the database instead of the persistence context.
        entityManager.clear();
        return id;
    }

    private String rawColumn(UUID id, String column) {
        return jdbcTemplate.queryForObject(
                "SELECT " + column + " FROM policies WHERE id = ?", String.class, id
        );
    }
}
