package org.constructx.policyhub.policies.api.dto.odrl;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Logical constraint: at least one operand must be fulfilled. Operands may be
 * atomic constraints or nested logical constraints.
 */
@Getter
@AllArgsConstructor
public class OdrlOrConstraintResponse implements OdrlConstraintResponse {

    @JsonProperty("odrl:or")
    private final List<OdrlConstraintResponse> or;
}
