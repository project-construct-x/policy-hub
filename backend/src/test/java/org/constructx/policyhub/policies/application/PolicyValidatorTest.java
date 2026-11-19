package org.constructx.policyhub.policies.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PolicyValidatorTest {

    private static final String MEMBERSHIP =
            "https://w3id.org/constructx/credentials/v0.1/MembershipCredential";

    private static final String SITE_ACCESS =
            "https://example.com/credentials/SiteAccessCredential";

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

    @Test
    void validate_participantDid_isValid() throws Exception {
        JsonNode constraint = participantDid(
                "did:web:a.example",
                "did:web:b.example"
        );

        assertDoesNotThrow(() ->
                policyValidator.validate(List.of(constraint))
        );
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "did:web:example.com",
            "did:web:localhost%3A8443",
            "did:web:example.com:user:alice",
            "did:web:example.com%3A8443:participants:acme_1",
            "did:web:example.com:path%20segment"
    })
    void validate_participantDidWithValidDid_isValid(String did)
            throws Exception {
        JsonNode constraint = participantDid(did);

        assertDoesNotThrow(() ->
                policyValidator.validate(List.of(constraint))
        );
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "{ \"type\": \"PARTICIPANT_DID\" }",
            "{ \"type\": \"PARTICIPANT_DID\", \"dids\": \"did:web:a.example\" }",
            "{ \"type\": \"PARTICIPANT_DID\", \"dids\": [] }"
    })
    void validate_participantDidWithoutEntries_throwsException(String json)
            throws Exception {
        JsonNode constraint = objectMapper.readTree(json);

        InvalidPolicyException exception = assertThrows(
                InvalidPolicyException.class,
                () -> policyValidator.validate(List.of(constraint))
        );

        assertEquals(
                "constraints[0].dids must contain at least one entry",
                exception.getMessage()
        );
    }

    @Test
    void validate_participantDidWithNonStringEntry_throwsException()
            throws Exception {
        JsonNode constraint = objectMapper.readTree("""
                {
                  "type": "PARTICIPANT_DID",
                  "dids": ["did:web:a.example", 42]
                }
                """);

        InvalidPolicyException exception = assertThrows(
                InvalidPolicyException.class,
                () -> policyValidator.validate(List.of(constraint))
        );

        assertEquals(
                "constraints[0].dids[1] must be a string",
                exception.getMessage()
        );
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "did:web:",
            "did:key:z6Mkabc",
            "DID:web:example.com",
            "did:web:-example.com",
            "did:web:example..com",
            "did:web:example.com:",
            "did:web:a.example,did:web:b.example",
            "did:web:a example",
            " did:web:a.example",
            "did:web:a.example ",
            "did:web:{{dids}}"
    })
    void validate_participantDidWithInvalidDid_throwsException(String did)
            throws Exception {
        JsonNode constraint = participantDid("did:web:valid.example", did);

        InvalidPolicyException exception = assertThrows(
                InvalidPolicyException.class,
                () -> policyValidator.validate(List.of(constraint))
        );

        assertEquals(
                "constraints[0].dids[1] must be a valid did:web identifier",
                exception.getMessage()
        );
    }

    @Test
    void validate_participantDidWithCaseInsensitiveDuplicate_throwsException()
            throws Exception {
        JsonNode constraint = participantDid(
                "did:web:a.example",
                "did:web:A.Example"
        );

        InvalidPolicyException exception = assertThrows(
                InvalidPolicyException.class,
                () -> policyValidator.validate(List.of(constraint))
        );

        assertEquals(
                "constraints[0].dids[1] is a duplicate",
                exception.getMessage()
        );
    }

    @Test
    void validate_participantDidTwice_throwsException() throws Exception {
        JsonNode first = participantDid("did:web:a.example");
        JsonNode second = participantDid("did:web:b.example");

        InvalidPolicyException exception = assertThrows(
                InvalidPolicyException.class,
                () -> policyValidator.validate(List.of(first, second))
        );

        assertEquals(
                "Constraint type may only occur once: PARTICIPANT_DID",
                exception.getMessage()
        );
    }

    private JsonNode participantDid(String... dids) {
        ObjectNode constraint = objectMapper.createObjectNode();
        constraint.put("type", "PARTICIPANT_DID");
        ArrayNode didArray = constraint.putArray("dids");
        for (String did : dids) {
            didArray.add(did);
        }
        return constraint;
    }

    @Test
    void validate_dataSubset_isValid() {
        JsonNode constraint = dataSubset(
                "field:materialName",
                "submodel:urn:samm:com.example.material:1.0.0#Material"
        );

        assertDoesNotThrow(() ->
                policyValidator.validate(List.of(constraint))
        );
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "field:materialName",
            "attribute:density",
            "submodel:urn:samm:com.example.material:1.0.0#Material",
            "record:batch-2027_01",
            "field:path/to~item.v2"
    })
    void validate_dataSubsetWithValidSelector_isValid(String selector) {
        JsonNode constraint = dataSubset(selector);

        assertDoesNotThrow(() ->
                policyValidator.validate(List.of(constraint))
        );
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "{ \"type\": \"DATA_SUBSET\" }",
            "{ \"type\": \"DATA_SUBSET\", \"selectors\": \"field:materialName\" }",
            "{ \"type\": \"DATA_SUBSET\", \"selectors\": [] }"
    })
    void validate_dataSubsetWithoutEntries_throwsException(String json)
            throws Exception {
        JsonNode constraint = objectMapper.readTree(json);

        InvalidPolicyException exception = assertThrows(
                InvalidPolicyException.class,
                () -> policyValidator.validate(List.of(constraint))
        );

        assertEquals(
                "constraints[0].selectors must contain at least one entry",
                exception.getMessage()
        );
    }

    @Test
    void validate_dataSubsetWithNonStringEntry_throwsException()
            throws Exception {
        JsonNode constraint = objectMapper.readTree("""
                {
                  "type": "DATA_SUBSET",
                  "selectors": ["field:materialName", 42]
                }
                """);

        InvalidPolicyException exception = assertThrows(
                InvalidPolicyException.class,
                () -> policyValidator.validate(List.of(constraint))
        );

        assertEquals(
                "constraints[0].selectors[1] must be a string",
                exception.getMessage()
        );
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "materialName",
            "field:",
            ":materialName",
            "column:materialName",
            "Field:materialName",
            "field:material name",
            "field:a,field:b",
            " field:materialName",
            "field:materialName ",
            "field:{{name}}",
            ""
    })
    void validate_dataSubsetWithInvalidSelector_throwsException(String selector) {
        JsonNode constraint = dataSubset("field:valid", selector);

        InvalidPolicyException exception = assertThrows(
                InvalidPolicyException.class,
                () -> policyValidator.validate(List.of(constraint))
        );

        assertEquals(
                "constraints[0].selectors[1] must match "
                        + "<field|attribute|submodel|record>:<identifier>",
                exception.getMessage()
        );
    }

    @Test
    void validate_dataSubsetWithExactDuplicate_throwsException() {
        JsonNode constraint = dataSubset(
                "field:materialName",
                "field:materialName"
        );

        InvalidPolicyException exception = assertThrows(
                InvalidPolicyException.class,
                () -> policyValidator.validate(List.of(constraint))
        );

        assertEquals(
                "constraints[0].selectors[1] is a duplicate",
                exception.getMessage()
        );
    }

    @Test
    void validate_dataSubsetWithDifferentCase_isValid() {
        // Case-sensitive: materialName and MaterialName may be different fields
        JsonNode constraint = dataSubset(
                "field:materialName",
                "field:MaterialName"
        );

        assertDoesNotThrow(() ->
                policyValidator.validate(List.of(constraint))
        );
    }

    @Test
    void validate_dataSubsetTwice_throwsException() {
        JsonNode first = dataSubset("field:materialName");
        JsonNode second = dataSubset("record:batch-1");

        InvalidPolicyException exception = assertThrows(
                InvalidPolicyException.class,
                () -> policyValidator.validate(List.of(first, second))
        );

        assertEquals(
                "Constraint type may only occur once: DATA_SUBSET",
                exception.getMessage()
        );
    }

    @Test
    void validate_credentialAttribute_isValid() {
        JsonNode constraint = credentialAttribute(
                credentialRule(MEMBERSHIP, "isMember", "eq", "true"),
                credentialRule(SITE_ACCESS, "site.accessLevel", "gteq", "4"),
                credentialRule(SITE_ACCESS, "roles[0]", "neq", "Site Visitor"),
                credentialListRule("isAnyOf", "Bauleitung", "Polier")
        );

        assertDoesNotThrow(() ->
                policyValidator.validate(List.of(constraint))
        );
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "{ \"type\": \"CREDENTIAL_ATTRIBUTE\" }",
            "{ \"type\": \"CREDENTIAL_ATTRIBUTE\", \"rules\": {} }",
            "{ \"type\": \"CREDENTIAL_ATTRIBUTE\", \"rules\": [] }"
    })
    void validate_credentialAttributeWithoutRules_throwsException(String json)
            throws Exception {
        JsonNode constraint = objectMapper.readTree(json);

        assertInvalid(constraint, "constraints[0].rules must contain at least one rule");
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "MembershipCredential",
            "http://w3id.org/constructx/credentials/v0.1/MembershipCredential",
            "https://w3id.org/constructx/credentials/v0.1/membershipCredential",
            "https://w3id.org/constructx/credentials/v0.1/Foo.Bar",
            "https://localhost/Foo",
            "{{x}}"
    })
    void validate_credentialAttributeWithInvalidType_throwsException(String credentialType) {
        JsonNode constraint = credentialAttribute(
                credentialRule(credentialType, "isMember", "eq", "true")
        );

        assertInvalid(
                constraint,
                "constraints[0].rules[0].credentialType must be a full https type IRI "
                        + "whose last segment starts with an uppercase letter"
        );
    }

    @ParameterizedTest
    @ValueSource(strings = {"a..b", ".a", "a.", "a[x]", "a b", "credentialSubject/a"})
    void validate_credentialAttributeWithInvalidPath_throwsException(String attributePath) {
        JsonNode constraint = credentialAttribute(
                credentialRule(SITE_ACCESS, attributePath, "eq", "x")
        );

        assertInvalid(
                constraint,
                "constraints[0].rules[0].attributePath must be dot-separated field names "
                        + "with an optional [index]"
        );
    }

    @Test
    void validate_credentialAttributeWithMissingField_namesRuleAndField() {
        JsonNode constraint = credentialAttribute(
                credentialRule(MEMBERSHIP, "isMember", "eq", "true"),
                credentialRule(SITE_ACCESS, "", "eq", "x")
        );

        assertInvalid(constraint, "constraints[0].rules[1].attributePath is required");
    }

    @Test
    void validate_credentialAttributeWithUnknownOperator_throwsException() {
        JsonNode constraint = credentialAttribute(
                credentialRule(SITE_ACCESS, "roles", "isPartOf", "x")
        );

        assertInvalid(
                constraint,
                "constraints[0].rules[0].operator must be one of "
                        + "eq, neq, gt, gteq, lt, lteq, isAnyOf, isNoneOf"
        );
    }

    @Test
    void validate_credentialAttributeComparisonWithText_throwsException() {
        JsonNode constraint = credentialAttribute(
                credentialRule(SITE_ACCESS, "accessLevel", "gt", "vier")
        );

        assertInvalid(constraint, "constraints[0].rules[0].value must be a number");
    }

    @ParameterizedTest
    @ValueSource(strings = {"[1]", "a\"b", "{{x}}", " x", "x ", "a\\b"})
    void validate_credentialAttributeWithInvalidValue_throwsException(String value) {
        JsonNode constraint = credentialAttribute(
                credentialRule(SITE_ACCESS, "role", "eq", value)
        );

        assertInvalid(
                constraint,
                "constraints[0].rules[0].value must be 1-200 characters "
                        + "without { } [ ] \" \\ and without surrounding whitespace"
        );
    }

    @Test
    void validate_credentialAttributeListWithoutValues_throwsException() {
        JsonNode constraint = credentialAttribute(credentialListRule("isAnyOf"));

        assertInvalid(constraint, "constraints[0].rules[0].values must contain at least one entry");
    }

    @Test
    void validate_credentialAttributeListWithDuplicate_throwsException() {
        JsonNode constraint = credentialAttribute(
                credentialListRule("isNoneOf", "Gast", "Gast")
        );

        assertInvalid(constraint, "constraints[0].rules[0].values[1] is a duplicate");
    }

    @Test
    void validate_credentialAttributeListIgnoresValue() {
        ObjectNode rule = credentialListRule("isAnyOf", "Bauleitung");
        rule.put("value", "[ungueltig]");

        assertDoesNotThrow(() ->
                policyValidator.validate(List.of(credentialAttribute(rule)))
        );
    }

    private void assertInvalid(JsonNode constraint, String expectedMessage) {
        InvalidPolicyException exception = assertThrows(
                InvalidPolicyException.class,
                () -> policyValidator.validate(List.of(constraint))
        );

        assertEquals(expectedMessage, exception.getMessage());
    }

    private JsonNode credentialAttribute(ObjectNode... rules) {
        ObjectNode constraint = objectMapper.createObjectNode();
        constraint.put("type", "CREDENTIAL_ATTRIBUTE");
        ArrayNode ruleArray = constraint.putArray("rules");
        for (ObjectNode rule : rules) {
            ruleArray.add(rule);
        }
        return constraint;
    }

    private ObjectNode credentialRule(
            String credentialType,
            String attributePath,
            String operator,
            String value
    ) {
        ObjectNode rule = objectMapper.createObjectNode();
        rule.put("credentialType", credentialType);
        rule.put("attributePath", attributePath);
        rule.put("operator", operator);
        rule.put("value", value);
        rule.putArray("values");
        return rule;
    }

    private ObjectNode credentialListRule(String operator, String... values) {
        ObjectNode rule = credentialRule(SITE_ACCESS, "roles", operator, "");
        ArrayNode valueArray = rule.putArray("values");
        for (String value : values) {
            valueArray.add(value);
        }
        return rule;
    }

    private JsonNode dataSubset(String... selectors) {
        ObjectNode constraint = objectMapper.createObjectNode();
        constraint.put("type", "DATA_SUBSET");
        ArrayNode selectorArray = constraint.putArray("selectors");
        for (String selector : selectors) {
            selectorArray.add(selector);
        }
        return constraint;
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

