package org.constructx.policyhub.policies.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PolicyValidatorTest {

    private PolicyValidator policyValidator;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        policyValidator = new PolicyValidator();
        objectMapper = new ObjectMapper();
    }

    @Test
    void validate_dateRange_isValid() throws Exception {
        JsonNode constraint = dateRange(
                LocalDate.now().plusDays(1),
                LocalDate.now().plusMonths(1)
        );

        assertDoesNotThrow(() ->
                policyValidator.validate(List.of(constraint))
        );
    }

    @Test
    void validate_dateRangeWithoutStartDate_throwsException()
            throws Exception {
        JsonNode constraint = objectMapper.readTree("""
                {
                  "type": "DATE_RANGE",
                  "endDate": "2099-12-31"
                }
                """);

        InvalidPolicyException exception = assertThrows(
                InvalidPolicyException.class,
                () -> policyValidator.validate(List.of(constraint))
        );

        assertEquals(
                "constraints[0].startDate is required",
                exception.getMessage()
        );
    }

    @Test
    void validate_dateRangeWithoutEndDate_throwsException()
            throws Exception {
        JsonNode constraint = objectMapper.readTree("""
                {
                  "type": "DATE_RANGE",
                  "startDate": "2099-01-01"
                }
                """);

        InvalidPolicyException exception = assertThrows(
                InvalidPolicyException.class,
                () -> policyValidator.validate(List.of(constraint))
        );

        assertEquals(
                "constraints[0].endDate is required",
                exception.getMessage()
        );
    }

    @Test
    void validate_dateRangeWithInvalidStartDate_throwsException()
            throws Exception {
        JsonNode constraint = objectMapper.readTree("""
                {
                  "type": "DATE_RANGE",
                  "startDate": "01.08.2026",
                  "endDate": "2099-12-31"
                }
                """);

        InvalidPolicyException exception = assertThrows(
                InvalidPolicyException.class,
                () -> policyValidator.validate(List.of(constraint))
        );

        assertEquals(
                "constraints[0].startDate must be a valid ISO date in YYYY-MM-DD format",
                exception.getMessage()
        );
    }

    @Test
    void validate_dateRangeWithInvalidEndDate_throwsException()
            throws Exception {
        JsonNode constraint = objectMapper.readTree("""
                {
                  "type": "DATE_RANGE",
                  "startDate": "2099-01-01",
                  "endDate": "31.12.2099"
                }
                """);

        InvalidPolicyException exception = assertThrows(
                InvalidPolicyException.class,
                () -> policyValidator.validate(List.of(constraint))
        );

        assertEquals(
                "constraints[0].endDate must be a valid ISO date in YYYY-MM-DD format",
                exception.getMessage()
        );
    }

    @Test
    void validate_dateRangeWithStartDateInPast_throwsException()
            throws Exception {
        JsonNode constraint = dateRange(
                LocalDate.now().minusDays(1),
                LocalDate.now().plusMonths(1)
        );

        InvalidPolicyException exception = assertThrows(
                InvalidPolicyException.class,
                () -> policyValidator.validate(List.of(constraint))
        );

        assertEquals(
                "constraints[0].startDate must not be in the past",
                exception.getMessage()
        );
    }

    @Test
    void validate_updateKeepingStoredPastStartDate_isAccepted()
            throws Exception {
        LocalDate pastStart = LocalDate.now().minusMonths(3);
        JsonNode stored = dateRange(pastStart, LocalDate.now().plusMonths(1));
        JsonNode edited = dateRange(pastStart, LocalDate.now().plusMonths(6));

        policyValidator.validate(List.of(edited), List.of(stored));
    }

    @Test
    void validate_updateChangingStartDateToOtherPastDate_throwsException()
            throws Exception {
        JsonNode stored = dateRange(
                LocalDate.now().minusMonths(3),
                LocalDate.now().plusMonths(1)
        );
        JsonNode edited = dateRange(
                LocalDate.now().minusMonths(2),
                LocalDate.now().plusMonths(1)
        );

        InvalidPolicyException exception = assertThrows(
                InvalidPolicyException.class,
                () -> policyValidator.validate(List.of(edited), List.of(stored))
        );

        assertEquals(
                "constraints[0].startDate must not be in the past",
                exception.getMessage()
        );
    }

    @Test
    void validate_updateChangingStartDateToFutureDate_isAccepted()
            throws Exception {
        JsonNode stored = dateRange(
                LocalDate.now().minusMonths(3),
                LocalDate.now().plusMonths(1)
        );
        JsonNode edited = dateRange(
                LocalDate.now().plusDays(1),
                LocalDate.now().plusMonths(2)
        );

        policyValidator.validate(List.of(edited), List.of(stored));
    }

    @Test
    void validate_dateRangeWithEndDateInPast_throwsException()
            throws Exception {
        JsonNode constraint = dateRange(
                LocalDate.now(),
                LocalDate.now().minusDays(1)
        );

        InvalidPolicyException exception = assertThrows(
                InvalidPolicyException.class,
                () -> policyValidator.validate(List.of(constraint))
        );

        assertEquals(
                "constraints[0].endDate must not be in the past",
                exception.getMessage()
        );
    }

    @Test
    void validate_dateRangeWithStartAfterEnd_throwsException()
            throws Exception {
        JsonNode constraint = dateRange(
                LocalDate.now().plusMonths(2),
                LocalDate.now().plusMonths(1)
        );

        InvalidPolicyException exception = assertThrows(
                InvalidPolicyException.class,
                () -> policyValidator.validate(List.of(constraint))
        );

        assertEquals(
                "constraints[0].startDate must not be after endDate",
                exception.getMessage()
        );
    }

    @Test
    void validate_oldEndDateType_throwsException()
            throws Exception {
        JsonNode constraint = objectMapper.readTree("""
                {
                  "type": "END_DATE",
                  "endDate": "2099-12-31"
                }
                """);

        InvalidPolicyException exception = assertThrows(
                InvalidPolicyException.class,
                () -> policyValidator.validate(List.of(constraint))
        );

        assertEquals(
                "Unsupported constraint type: END_DATE",
                exception.getMessage()
        );
    }

    private JsonNode dateRange(
            LocalDate startDate,
            LocalDate endDate
    ) throws Exception {
        return objectMapper.readTree("""
                {
                  "type": "DATE_RANGE",
                  "startDate": "%s",
                  "endDate": "%s"
                }
                """.formatted(startDate, endDate));
    }
}

