package org.constructx.policyhub.policies.domain;

/**
 * Defines how a policy is applied within the Policy Hub.
 */
public enum PolicyCategory {

    /**
     * Defines conditions that must be fulfilled to access data.
     */
    ACCESS,

    /**
     * Defines conditions that must be fulfilled for the usage of data
     * within a contractual context.
     */
    CONTRACT
}