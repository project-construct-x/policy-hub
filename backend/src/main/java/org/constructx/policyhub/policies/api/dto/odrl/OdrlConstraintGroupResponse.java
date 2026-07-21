package org.constructx.policyhub.policies.api.dto.odrl;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class OdrlConstraintGroupResponse implements OdrlConstraintResponse {

    @JsonProperty("odrl:and")
    private final List<OdrlAtomicConstraintResponse> and;
}
