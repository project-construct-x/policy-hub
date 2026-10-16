-- V4: Every policy created in the Hub carries the fixed policy ID prefix "con-x-policyHub-".
-- Existing policies get the prefix prepended; already prefixed ones are left untouched.

UPDATE policies
SET policy_id = 'con-x-policyHub-' || policy_id
WHERE policy_id NOT LIKE 'con-x-policyHub-%';
