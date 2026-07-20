package org.constructx.policyhub.policies.api.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.constructx.policyhub.policies.domain.PolicyCategory;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class PolicyResponse {

    private final UUID id;
    private final String policyId;
    private final PolicyCategory category;
    private final List<JsonNode> constraints;
    private final String legalText;
    private final Instant createdAt;
    private final Instant updatedAt;
}
