package org.constructx.policyhub.core.exception;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor
@Schema(description = "Persisted Policy Hub policy")
public class ErrorResponse {

    @Schema(example = "2026-07-21T12:00:00Z")
    Instant timestamp;

    @Schema(example = "400")
    int status;

    @Schema(example = "Bad Request")
    String error;

    @Schema(example = "constraints[0].useCases must contain at least one value")
    String message;

    @Schema(example = "/api/v1/policies")
    String path;

    public static ErrorResponse of(int status, String error, String message, String path) {
        return new ErrorResponse(Instant.now(), status, error, message, path);
    }
}
