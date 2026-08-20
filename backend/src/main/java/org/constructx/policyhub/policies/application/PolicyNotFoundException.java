package org.constructx.policyhub.policies.application;

import java.util.UUID;

public class PolicyNotFoundException extends RuntimeException {

    public PolicyNotFoundException(UUID id) {
        super("Policy with id " + id + " was not found");
    }
}