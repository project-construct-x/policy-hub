package org.constructx.policyhub.policies.api.dto.odrl;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
@JsonPropertyOrder({
    "@context",
    "@type",
    "@id",
    "policy"
})
public class OdrlPolicyDefinitionResponse {
    @JsonProperty("@context")
    private final OdrlContextResponse context;

    @JsonProperty("@type")
    private final String type;

    @JsonProperty("@id")
    private final String id;
    
    private final OdrlPolicyResponse policy; 
}
