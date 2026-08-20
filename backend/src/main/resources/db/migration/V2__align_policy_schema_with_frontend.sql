-- V2: Align persistence model with the frontend policy contract

DROP INDEX IF EXISTS idx_policies_status;
DROP INDEX IF EXISTS idx_policies_content;

ALTER TABLE policies
DROP CONSTRAINT IF EXISTS chk_policies_status;

ALTER TABLE policies
DROP COLUMN name,
    DROP COLUMN description,
    DROP COLUMN status,
    DROP COLUMN content;

ALTER TABLE policies
    ADD COLUMN policy_id VARCHAR(200) NOT NULL,
    ADD COLUMN category VARCHAR(50) NOT NULL,
    ADD COLUMN constraints JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN legal_text TEXT NOT NULL;

ALTER TABLE policies
    ADD CONSTRAINT uk_policies_policy_id UNIQUE (policy_id);

ALTER TABLE policies
    ADD CONSTRAINT chk_policies_category
        CHECK (category IN ('ACCESS', 'CONTRACT'));

CREATE INDEX idx_policies_constraints
    ON policies USING GIN (constraints);