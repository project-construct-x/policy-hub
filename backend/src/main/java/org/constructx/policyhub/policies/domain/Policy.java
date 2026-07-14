package org.constructx.policyhub.policies.domain;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record Policy(
        UUID id,
        String policyId,
        PolicyCategory category,
        List<JsonNode> constraints,
        String legalText,
        Instant createdAt,
        Instant updatedAt
) {
}
