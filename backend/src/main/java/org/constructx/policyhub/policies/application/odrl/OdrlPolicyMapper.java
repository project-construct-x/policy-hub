package org.constructx.policyhub.policies.application.odrl;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.fasterxml.jackson.databind.JsonNode;
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
    private static final OdrlContextResponse ODRL_CONTEXT = new OdrlContextResponse(
        "https://w3id.org/edc/v0.0.1/ns/",
        "https://w3id.org/edc/v0.0.1/ns/",
        "http://www.w3.org/ns/odrl/2/"
    );

    private static final String ODRL_USE = "odrl:use";
    private static final String CX_POLICY_NS = "https://w3id.org/catenax/2025/9/policy/";
    private static final String CX_ACCESS = CX_POLICY_NS + "access";

    public OdrlPolicyDefinitionResponse policyToOdrl(Policy policy) {
        final OdrlIdResponse action = new OdrlIdResponse(actionForCategory(policy.category()));
        final OdrlConstraintResponse constraint;
        try {
            constraint = odrlConstraint(policy);
        } catch (UnsupportedConstraintException e) {
            throw new UnsupportedConstraintException(policy.policyId(), e.rawType());
        }
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
        return switch (category) {
            case ACCESS -> CX_ACCESS;
            case CONTRACT -> ODRL_USE;
        };
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
     *   <li>Constraints that always apply (DATA_SUBSET, see
     *       {@link OdrlConstraintMapper#alwaysApplies}) are not put into
     *       {@code odrl:or} but appended via an outer {@code odrl:and}:
     *       {@code { odrl:and: [ { odrl:or: [...] }, <data subset> ] }}. With at
     *       most one other constraint left, AND is equivalent and everything is
     *       flat in {@code odrl:and}, the data subset last.</li>
     * </ul>
     * Must stay identical to {@code odrlConstraintGroup} in the frontend ODRL mapper.
     * Returns {@code null} without constraints, so {@code odrl:constraint} is omitted.
     */
    private OdrlConstraintResponse odrlConstraint(Policy policy) {
        if (policy.constraints().isEmpty()) {
            return null;
        }

        if (LogicalOperator.orDefault(policy.logicalOperator()) == LogicalOperator.OR) {
            return toOdrlOrGroup(policy.constraints());
        }

        return new OdrlAndConstraintResponse(toAtomicOdrlConstraints(policy.constraints()));
    }

    /**
     * OR-combines all conditions; constraints that always apply are appended
     * via an outer {@code odrl:and} (see {@link #odrlConstraint}).
     */
    private static OdrlConstraintResponse toOdrlOrGroup(List<JsonNode> constraints) {
        final Map<Boolean, List<JsonNode>> split = constraints.stream()
                .collect(Collectors.partitioningBy(OdrlConstraintMapper::alwaysApplies));
        final List<JsonNode> conditions = split.get(false);
        final List<JsonNode> restrictions = split.get(true);

        if (restrictions.isEmpty()) {
            return toOdrlOrConstraint(conditions);
        }

        final List<OdrlConstraintResponse> operands = new ArrayList<>(toConditionOperands(conditions));
        operands.addAll(toAtomicOdrlConstraints(restrictions));
        return new OdrlAndConstraintResponse(operands);
    }

    /**
     * Several conditions stay OR-combined in a nested {@code odrl:or}; with at
     * most one condition, AND is equivalent and its atomic constraints are flat.
     */
    private static List<OdrlConstraintResponse> toConditionOperands(List<JsonNode> conditions) {
        if (conditions.size() > 1) {
            return List.of(toOdrlOrConstraint(conditions));
        }
        return toAtomicOdrlConstraints(conditions);
    }

    private static OdrlOrConstraintResponse toOdrlOrConstraint(List<JsonNode> constraints) {
        final List<OdrlConstraintResponse> operands =
                constraints.stream()
                        .map(OdrlConstraintMapper::constraintToOdrl)
                        .map(OdrlPolicyMapper::toOdrlOrOperand)
                        .toList();
        return new OdrlOrConstraintResponse(operands);
    }

    private static List<OdrlConstraintResponse> toAtomicOdrlConstraints(List<JsonNode> constraints) {
        return constraints.stream()
                .<OdrlConstraintResponse>flatMap(
                        constraint ->
                                OdrlConstraintMapper
                                        .constraintToOdrl(constraint)
                                        .stream()
                )
                .toList();
    }

    private static OdrlConstraintResponse toOdrlOrOperand(List<OdrlAtomicConstraintResponse> atomics) {
        if (atomics.size() == 1) {
            return atomics.get(0);
        }
        return new OdrlAndConstraintResponse(List.copyOf(atomics));
    }
}
