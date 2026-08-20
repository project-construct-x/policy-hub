package org.constructx.policyhub.policies.domain;

/**
 * Supported policy constraint types.
 *
 * <p>The values mirror the policy constraint contract used by the frontend
 * and are mapped to their corresponding ODRL representation in the backend.</p>
 *
 * <p>See the Construct-X policy frontend constraint model and the
 * Catena-X policy/ODRL specification used by this project.</p>
 */
public enum ConstraintType {

    /**
     * Restricts access or usage to active Construct-X members.
     */
    MEMBERSHIP,

    /**
     * Restricts data usage to one or more defined use cases.
     */
    USE_CASE,

    /**
     * Restricts access or usage to a defined start and end date.
     */
    DATE_RANGE,

    /**
     * Requires acceptance of a defined framework agreement.
     */
    FRAMEWORK_AGREEMENT
}