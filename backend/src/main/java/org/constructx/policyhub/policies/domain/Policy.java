package org.constructx.policyhub.policies.domain;

import java.time.Instant;
import java.util.UUID;

public record Policy(
        UUID id,
        String name,
        String description,
        PolicyStatus status,
        String content,
        Instant createdAt,
        Instant updatedAt
) {
}
