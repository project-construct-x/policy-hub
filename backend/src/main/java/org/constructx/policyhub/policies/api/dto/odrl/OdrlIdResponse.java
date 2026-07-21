package org.constructx.policyhub.policies.api.dto.odrl;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class OdrlIdResponse {
    
    @JsonProperty("@id")
    private String id;
}
