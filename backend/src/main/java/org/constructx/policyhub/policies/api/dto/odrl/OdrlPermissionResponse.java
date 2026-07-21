package org.constructx.policyhub.policies.api.dto.odrl;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OdrlPermissionResponse {
    
    @JsonProperty("odrl:action")
    private OdrlIdResponse action;

    @JsonProperty("odrl:constraint")
    private OdrlConstraintResponse constraint;
}
