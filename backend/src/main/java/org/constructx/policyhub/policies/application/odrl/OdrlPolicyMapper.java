package org.constructx.policyhub.policies.application.odrl;

import java.util.List;

import org.constructx.policyhub.policies.api.dto.odrl.OdrlAtomicConstraintResponse;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlConstraintGroupResponse;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlConstraintResponse;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlContextResponse;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlIdResponse;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlPermissionResponse;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlPolicyDefinitionResponse;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlPolicyResponse;
import org.constructx.policyhub.policies.domain.Policy;
import org.constructx.policyhub.policies.domain.PolicyCategory;
import org.springframework.stereotype.Service;

@Service
public class OdrlPolicyMapper {
    private final String CX_POLICY_NS = "https://w3id.org/catenax/2025/9/policy/";
    private final String ODRL_USE = "odrl:use";
    private final String CX_ACCESS = CX_POLICY_NS + "access";
    private final OdrlContextResponse ODRL_CONTEXT = new OdrlContextResponse(
        "https://w3id.org/edc/v0.0.1/ns/",
        "https://w3id.org/edc/v0.0.1/ns/",
        "http://www.w3.org/ns/odrl/2/"
    );

    public OdrlPolicyDefinitionResponse policyToOdrl(Policy policy) {
        final OdrlIdResponse action = new OdrlIdResponse(actionForCategory(policy.category()));
        final List<OdrlAtomicConstraintResponse> atomics = policy.constraints().stream().map(OdrlConstraintMapper::constraintToOdrl).toList();
        final OdrlConstraintResponse constraint = odrlConstraint(atomics);
        final OdrlPermissionResponse permission = new OdrlPermissionResponse(action, constraint);

        return new OdrlPolicyDefinitionResponse(
            ODRL_CONTEXT, 
            "PolicyDefinition",
            policy.policyId(),
            new OdrlPolicyResponse(
                "http://www.w3.org/ns/odrl.jsonld",
                "Set",
                List.of(permission),
                List.of(),
                List.of()
            )
        );
    }

    private String actionForCategory(PolicyCategory category) {
        return category == PolicyCategory.ACCESS ? CX_ACCESS : ODRL_USE;
    }

    private OdrlConstraintResponse odrlConstraint(List<OdrlAtomicConstraintResponse> atomics) {
        if (atomics.isEmpty()) {
            return null;
        } 
        return new OdrlConstraintGroupResponse(atomics);
    }
}
