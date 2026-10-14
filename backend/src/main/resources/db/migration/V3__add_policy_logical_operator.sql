-- V3: Logical combination of a policy's constraints (odrl:and / odrl:or)
-- Existing policies keep their previous semantics (AND).

ALTER TABLE policies
    ADD COLUMN logical_operator VARCHAR(3) NOT NULL DEFAULT 'AND';

ALTER TABLE policies
    ADD CONSTRAINT chk_policies_logical_operator
        CHECK (logical_operator IN ('AND', 'OR'));
