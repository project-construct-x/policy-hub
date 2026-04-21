package org.constructx.policyhub.policies.infrastructure;

import org.constructx.policyhub.policies.domain.Policy;
import org.springframework.stereotype.Component;

@Component
public class PolicyMapper {

    public Policy toDomain(PolicyEntity entity) {
        return new Policy(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getStatus(),
                entity.getContent(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public PolicyEntity toEntity(Policy domain) {
        PolicyEntity entity = new PolicyEntity();
        entity.setId(domain.id());
        entity.setName(domain.name());
        entity.setDescription(domain.description());
        entity.setStatus(domain.status());
        entity.setContent(domain.content());
        return entity;
    }
}
