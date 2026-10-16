-- V5: The fixed policy ID prefix changes from "con-x-policyHub-" to "con-x-ph-".
-- V4 stays untouched (Flyway checksum); this migration rewrites the prefix of all policies.

UPDATE policies
SET policy_id = 'con-x-ph-' || substring(policy_id FROM char_length('con-x-policyHub-') + 1)
WHERE policy_id LIKE 'con-x-policyHub-%';
