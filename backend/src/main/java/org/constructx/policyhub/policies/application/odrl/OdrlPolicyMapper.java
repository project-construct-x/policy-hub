package org.constructx.policyhub.policies.application.odrl;

import java.util.List;

import org.constructx.policyhub.policies.api.dto.odrl.OdrlAndConstraintResponse;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlAtomicConstraintResponse;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlConstraintResponse;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlContextResponse;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlIdResponse;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlOrConstraintResponse;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlPermissionResponse;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlPolicyDefinitionResponse;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlPolicyResponse;
import org.constructx.policyhub.policies.domain.LogicalOperator;
import org.constructx.policyhub.policies.domain.Policy;
import org.constructx.policyhub.policies.domain.PolicyCategory;
import org.springframework.stereotype.Service;

@Service
public class OdrlPolicyMapper {
    private final OdrlContextResponse ODRL_CONTEXT = new OdrlContextResponse(
        "https://w3id.org/edc/v0.0.1/ns/",
        "https://w3id.org/edc/v0.0.1/ns/",
        "http://www.w3.org/ns/odrl/2/"
    );

    public OdrlPolicyDefinitionResponse policyToOdrl(Policy policy) {
        final OdrlIdResponse action = new OdrlIdResponse(actionForCategory(policy.category()));
        final OdrlConstraintResponse constraint = odrlConstraint(policy);
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
        String ODRL_USE = "odrl:use";
        String CX_POLICY_NS = "https://w3id.org/catenax/2025/9/policy/";
        String CX_ACCESS = CX_POLICY_NS + "access";
        return category == PolicyCategory.ACCESS ? CX_ACCESS : ODRL_USE;
    }

    /**
     * Maps the constraints of a policy to the logical constraint below
     * {@code odrl:constraint}.
     * <ul>
     *   <li>AND: all atomic constraints flat in {@code odrl:and}.</li>
     *   <li>OR: one operand per constraint in {@code odrl:or}. A constraint that
     *       maps to several atomic constraints (DATE_RANGE: start AND end) is
     *       wrapped in a nested {@code odrl:and}; flat inside {@code odrl:or} it
     *       would mean "start OR end".</li>
     * </ul>
     * Returns {@code null} without constraints, so {@code odrl:constraint} is omitted.
     */
    private OdrlConstraintResponse odrlConstraint(Policy policy) {
        if (policy.constraints().isEmpty()) {
            return null;
        }

        if (LogicalOperator.orDefault(policy.logicalOperator()) == LogicalOperator.OR) {
            final List<OdrlConstraintResponse> operands =
                    policy.constraints().stream()
                            .map(OdrlConstraintMapper::constraintToOdrl)
                            .map(OdrlPolicyMapper::operand)
                            .toList();
            return new OdrlOrConstraintResponse(operands);
        }

        final List<OdrlConstraintResponse> atomics =
                policy.constraints().stream()
                        .flatMap(
                                constraint ->
                                        OdrlConstraintMapper
                                                .constraintToOdrl(constraint)
                                                .stream()
                        )
                        .map(OdrlConstraintResponse.class::cast)
                        .toList();
        return new OdrlAndConstraintResponse(atomics);
    }

    private static OdrlConstraintResponse operand(List<OdrlAtomicConstraintResponse> atomics) {
        if (atomics.size() == 1) {
            return atomics.get(0);
        }
        return new OdrlAndConstraintResponse(List.copyOf(atomics));
    }
}
