package org.constructx.policyhub.policies.infrastructure;

import org.constructx.policyhub.policies.api.dto.UpdatePolicyRequest;
import org.constructx.policyhub.policies.domain.LogicalOperator;
import org.constructx.policyhub.policies.domain.Policy;
import org.springframework.stereotype.Component;

@Component
public class PolicyMapper {

    public Policy toDomain(PolicyEntity entity) {
        return new Policy(
                entity.getId(),
                entity.getPolicyId(),
                entity.getCategory(),
                entity.getConstraints(),
                LogicalOperator.orDefault(entity.getLogicalOperator()),
                entity.getLegalText(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public PolicyEntity toEntity(Policy domain) {
        PolicyEntity entity = new PolicyEntity();
        entity.setId(domain.id());
        entity.setPolicyId(domain.policyId());
        entity.setCategory(domain.category());
        entity.setConstraints(domain.constraints());
        entity.setLogicalOperator(LogicalOperator.orDefault(domain.logicalOperator()));
        entity.setLegalText(domain.legalText());
        return entity;
    }

    public void updateEntity(
            UpdatePolicyRequest request,
            PolicyEntity entity
    ) {
        entity.setPolicyId(request.policyId());
        entity.setCategory(request.category());
        entity.setConstraints(request.constraints());
        entity.setLogicalOperator(LogicalOperator.orDefault(request.logicalOperator()));
        entity.setLegalText(request.legalText());
    }
}
