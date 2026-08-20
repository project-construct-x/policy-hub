package org.constructx.policyhub.policies.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PolicyRepository extends JpaRepository<PolicyEntity, UUID> {

    boolean existsByPolicyId(String policyId);

    Optional<PolicyEntity> findByPolicyId(String policyId);
}