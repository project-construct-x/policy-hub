package org.constructx.policyhub.policies.application.odrl;

import org.constructx.policyhub.policies.api.dto.odrl.OdrlAtomicConstraintResponse;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlIdResponse;
import org.constructx.policyhub.policies.domain.ConstraintType;

import com.fasterxml.jackson.databind.JsonNode;

public class OdrlConstraintMapper {

    private static final String CX_POLICY_NS = "https://w3id.org/catenax/2025/9/policy/";

    public static OdrlAtomicConstraintResponse constraintToOdrl(JsonNode c) {
        ConstraintType type = ConstraintType.valueOf(c.get("type").asText());
        return switch (type) {
            case MEMBERSHIP -> mapMembership(c);
            case USE_CASE -> mapUseCase(c);
            case END_DATE -> mapEndDate(c);
            case FRAMEWORK_AGREEMENT -> mapFrameworkAgreement(c);
        };
    }

    private static OdrlAtomicConstraintResponse mapMembership(JsonNode c) {
        return new OdrlAtomicConstraintResponse(
            new OdrlIdResponse(CX_POLICY_NS + "Membership"),
            new OdrlIdResponse(OdrlOperator.EQ.value()),
            c.get("value")
        );
    }

    private static OdrlAtomicConstraintResponse mapUseCase(JsonNode c) {
        return new OdrlAtomicConstraintResponse(
            new OdrlIdResponse(CX_POLICY_NS + "UsagePurpose"),
            new OdrlIdResponse(OdrlOperator.IS_ANY_OF.value()),
            c.get("useCases")
        );
    }

    private static OdrlAtomicConstraintResponse mapEndDate(JsonNode c) {
        return new OdrlAtomicConstraintResponse(
            new OdrlIdResponse(CX_POLICY_NS + "DataUsageEndDate"),
            new OdrlIdResponse(OdrlOperator.EQ.value()),
            c.get("endDate")
        );
    }

    private static OdrlAtomicConstraintResponse mapFrameworkAgreement(JsonNode c) {
        return new OdrlAtomicConstraintResponse(
            new OdrlIdResponse(CX_POLICY_NS + "FrameworkAgreement"),
            new OdrlIdResponse(OdrlOperator.EQ.value()),
            c.get("agreement")
        );
    }


    private enum OdrlOperator {
        EQ("odrl:eq"),
        IS_ANY_OF("odrl:isAnyOf");

        private final String value;

        OdrlOperator(String value) {
            this.value = value;
        }

        public String value() {
            return value;
        }
    }
}
