package org.constructx.policyhub.policies.api.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class PolicyResponse {

    private final UUID id;
    private final String name;
    private final String description;
    private final String status;
    private final String content;
    private final Instant createdAt;
    private final Instant updatedAt;
}
