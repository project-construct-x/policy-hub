package org.constructx.policyhub.policies.api.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PolicyResponse {

    private final String id;
    private final String name;
    private final String status;
}
