package org.constructx.policyhub.policies.application;

public class InvalidPolicyException extends RuntimeException {

    public InvalidPolicyException(String message) {
        super(message);
    }
}