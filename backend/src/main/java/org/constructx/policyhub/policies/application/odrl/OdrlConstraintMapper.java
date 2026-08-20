package org.constructx.policyhub.policies.application.odrl;

import com.fasterxml.jackson.databind.JsonNode;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlAtomicConstraintResponse;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlIdResponse;
import org.constructx.policyhub.policies.domain.ConstraintType;

import java.util.List;

public class OdrlConstraintMapper {

    private static final String CX_POLICY_NS =
            "https://w3id.org/catenax/2025/9/policy/";

    private OdrlConstraintMapper() {
    }

    public static List<OdrlAtomicConstraintResponse> constraintToOdrl(
            JsonNode constraint
    ) {
        ConstraintType type = ConstraintType.valueOf(
                constraint.get("type").asText()
        );

        return switch (type) {
            case MEMBERSHIP ->
                    List.of(mapMembership(constraint));

            case USE_CASE ->
                    List.of(mapUseCase(constraint));

            case DATE_RANGE ->
                    mapDateRange(constraint);

            case FRAMEWORK_AGREEMENT ->
                    List.of(mapFrameworkAgreement(constraint));
        };
    }

    private static OdrlAtomicConstraintResponse mapMembership(
            JsonNode constraint
    ) {
        return new OdrlAtomicConstraintResponse(
                new OdrlIdResponse(CX_POLICY_NS + "Membership"),
                new OdrlIdResponse(OdrlOperator.EQ.value()),
                constraint.get("value")
        );
    }

    private static OdrlAtomicConstraintResponse mapUseCase(
            JsonNode constraint
    ) {
        return new OdrlAtomicConstraintResponse(
                new OdrlIdResponse(CX_POLICY_NS + "UsagePurpose"),
                new OdrlIdResponse(OdrlOperator.IS_ANY_OF.value()),
                constraint.get("useCases")
        );
    }

    private static List<OdrlAtomicConstraintResponse> mapDateRange(
            JsonNode constraint
    ) {
        OdrlAtomicConstraintResponse startDateConstraint =
                new OdrlAtomicConstraintResponse(
                        new OdrlIdResponse(
                                CX_POLICY_NS + "DataUsageStartDate"
                        ),
                        new OdrlIdResponse(
                                OdrlOperator.GTEQ.value()
                        ),
                        constraint.get("startDate")
                );

        OdrlAtomicConstraintResponse endDateConstraint =
                new OdrlAtomicConstraintResponse(
                        new OdrlIdResponse(
                                CX_POLICY_NS + "DataUsageEndDate"
                        ),
                        new OdrlIdResponse(
                                OdrlOperator.LTEQ.value()
                        ),
                        constraint.get("endDate")
                );

        return List.of(
                startDateConstraint,
                endDateConstraint
        );
    }

    private static OdrlAtomicConstraintResponse mapFrameworkAgreement(
            JsonNode constraint
    ) {
        return new OdrlAtomicConstraintResponse(
                new OdrlIdResponse(
                        CX_POLICY_NS + "FrameworkAgreement"
                ),
                new OdrlIdResponse(OdrlOperator.EQ.value()),
                constraint.get("agreement")
        );
    }

    private enum OdrlOperator {
        EQ("odrl:eq"),
        IS_ANY_OF("odrl:isAnyOf"),
        GTEQ("odrl:gteq"),
        LTEQ("odrl:lteq");

        private final String value;

        OdrlOperator(String value) {
            this.value = value;
        }

        public String value() {
            return value;
        }
    }
}