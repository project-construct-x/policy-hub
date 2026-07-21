package org.constructx.policyhub.policies.api.dto.odrl;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
@JsonPropertyOrder({
    "@vocab",
    "edc",
    "odrl"
})
public class OdrlContextResponse {
    
    @JsonProperty("@vocab")
    private final String vocab;

    private final String edc;

    private final String odrl;
}
