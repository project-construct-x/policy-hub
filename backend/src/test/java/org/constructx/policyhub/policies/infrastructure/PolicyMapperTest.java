package org.constructx.policyhub.policies.infrastructure;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.constructx.policyhub.policies.api.dto.UpdatePolicyRequest;
import org.constructx.policyhub.policies.domain.LogicalOperator;
import org.constructx.policyhub.policies.domain.Policy;
import org.constructx.policyhub.policies.domain.PolicyCategory;
import org.junit.jupiter.api.Test;

class PolicyMapperTest {

    private final PolicyMapper policyMapper = new PolicyMapper();

    @Test
    void toEntity_mapsLogicalOperator() {
        Policy policy = policy(LogicalOperator.OR);

        assertEquals(LogicalOperator.OR, policyMapper.toEntity(policy).getLogicalOperator());
    }

    @Test
    void toEntity_defaultsMissingLogicalOperatorToAnd() {
        Policy policy = policy(null);

        assertEquals(LogicalOperator.AND, policyMapper.toEntity(policy).getLogicalOperator());
    }

    @Test
    void toDomain_mapsLogicalOperator() {
        PolicyEntity entity = new PolicyEntity();
        entity.setConstraints(List.of());
        entity.setLogicalOperator(LogicalOperator.OR);

        assertEquals(LogicalOperator.OR, policyMapper.toDomain(entity).logicalOperator());
    }

    @Test
    void updateEntity_defaultsMissingLogicalOperatorToAnd() {
        PolicyEntity entity = new PolicyEntity();
        entity.setLogicalOperator(LogicalOperator.OR);

        policyMapper.updateEntity(
                new UpdatePolicyRequest(
                        "policy-id",
                        PolicyCategory.ACCESS,
                        List.of(),
                        null,
                        "Legal Text"
                ),
                entity
        );

        assertEquals(LogicalOperator.AND, entity.getLogicalOperator());
    }

    @Test
    void updateEntity_mapsOrLogicalOperator() {
        PolicyEntity entity = new PolicyEntity();

        policyMapper.updateEntity(
                new UpdatePolicyRequest(
                        "policy-id",
                        PolicyCategory.ACCESS,
                        List.of(),
                        LogicalOperator.OR,
                        "Legal Text"
                ),
                entity
        );

        assertEquals(LogicalOperator.OR, entity.getLogicalOperator());
    }

    private Policy policy(LogicalOperator logicalOperator) {
        return new Policy(
                UUID.fromString("00000000-0000-0000-0000-000000000001"),
                "policy-id",
                PolicyCategory.ACCESS,
                List.of(),
                logicalOperator,
                "Legal Text",
                Instant.parse("2026-03-15T10:30:00Z"),
                Instant.parse("2026-04-29T09:40:00Z")
        );
    }
}
