package org.constructx.policyhub.policies.api.dto.odrl;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class OdrlAtomicConstraintResponse implements OdrlConstraintResponse {
    
    @JsonProperty("odrl:leftOperand")
    private final OdrlIdResponse leftOperand;
    
    @JsonProperty("odrl:operator")
    private final OdrlIdResponse operator;

    @JsonProperty("odrl:rightOperand")
    private final Object rightOperand;
}
