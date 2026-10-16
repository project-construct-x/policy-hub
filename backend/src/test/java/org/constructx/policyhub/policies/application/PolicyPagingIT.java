package org.constructx.policyhub.policies.application;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;

import org.constructx.policyhub.policies.api.dto.PolicyResponse;
import org.constructx.policyhub.policies.application.odrl.OdrlPolicyMapper;
import org.constructx.policyhub.policies.infrastructure.PolicyMapper;
import org.constructx.policyhub.policies.infrastructure.PolicyRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class PolicyPagingIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    private static final Timestamp SAME_UPDATED_AT =
            Timestamp.from(Instant.parse("2026-05-01T12:00:00Z"));

    @Autowired
    private PolicyRepository policyRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void getAllPolicies_pagesWithoutDuplicatesOrGapsWhenUpdatedAtIsEqual() {
        PolicyService policyService = new PolicyService(
                policyRepository,
                new PolicyMapper(),
                new PolicyValidator(),
                new OdrlPolicyMapper()
        );

        // Inserted in descending id order so that insertion order differs from the
        // expected tie-breaker order; otherwise the test could pass without one.
        List<UUID> idsAscending = IntStream.rangeClosed(1, 5)
                .mapToObj(i -> UUID.fromString("00000000-0000-0000-0000-00000000000" + i))
                .toList();
        for (UUID id : idsAscending.reversed()) {
            jdbcTemplate.update(
                    "INSERT INTO policies (id, policy_id, category, legal_text, created_at, updated_at)"
                            + " VALUES (?, ?, 'CONTRACT', 'Rechtstext', ?, ?)",
                    id, "policy-" + id, SAME_UPDATED_AT, SAME_UPDATED_AT
            );
        }

        Sort defaultSort = Sort.by(Sort.Direction.DESC, "updatedAt");
        List<UUID> paged = new ArrayList<>();
        for (int page = 0; page < 3; page++) {
            Pageable pageable = PageRequest.of(page, 2, defaultSort);
            policyService.getAllPolicies(pageable).getContent().stream()
                    .map(PolicyResponse::id)
                    .forEach(paged::add);
        }

        assertEquals(idsAscending, paged);
    }
}
