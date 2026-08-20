package org.constructx.policyhub.policies.api.dto.odrl;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class OdrlPolicyResponse {

    @JsonProperty("@context")
    private final String context;

    @JsonProperty("@type")
    private final String type;

    @JsonProperty("odrl:permission")
    private final List<OdrlPermissionResponse> permission;

    @JsonProperty("odrl:prohibition")
    private final List<OdrlProhibitionResponse> prohibition;

    @JsonProperty("odrl:obligation")
    private final List<OdrlObligationResponse> obligation;
}
