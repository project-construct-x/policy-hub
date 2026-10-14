package org.constructx.policyhub.policies.api.dto.odrl;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Logical constraint: all operands must be fulfilled. Operands may be atomic
 * constraints or nested logical constraints.
 */
@Getter
@AllArgsConstructor
public class OdrlAndConstraintResponse implements OdrlConstraintResponse {

    @JsonProperty("odrl:and")
    private final List<OdrlConstraintResponse> and;
}
