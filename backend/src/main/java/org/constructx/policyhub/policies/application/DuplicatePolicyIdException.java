package org.constructx.policyhub.policies.application;

public class DuplicatePolicyIdException extends RuntimeException {

    public DuplicatePolicyIdException(String message) {
        super(message);
    }
}
