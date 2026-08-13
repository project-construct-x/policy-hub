package org.constructx.policyhub.policies.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.constructx.policyhub.policies.api.dto.CreatePolicyRequest;
import org.constructx.policyhub.policies.api.dto.PolicyResponse;
import org.constructx.policyhub.policies.api.dto.UpdatePolicyRequest;
import org.constructx.policyhub.policies.api.dto.odrl.OdrlPolicyDefinitionResponse;
import org.constructx.policyhub.policies.application.odrl.OdrlPolicyMapper;
import org.constructx.policyhub.policies.domain.Policy;
import org.constructx.policyhub.policies.domain.PolicyCategory;
import org.constructx.policyhub.policies.infrastructure.PolicyEntity;
import org.constructx.policyhub.policies.infrastructure.PolicyMapper;
import org.constructx.policyhub.policies.infrastructure.PolicyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PolicyServiceTest {

    private static final UUID ID =
            UUID.fromString("00000000-0000-0000-0000-000000000001");

    private static final Instant CREATED_AT =
            Instant.parse("2026-03-15T10:30:00Z");

    private static final Instant UPDATED_AT =
            Instant.parse("2026-04-29T09:40:00Z");

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private PolicyRepository policyRepository;

    @Mock
    private PolicyMapper policyMapper;

    @Mock
    private PolicyValidator policyValidator;

    @Mock
    private OdrlPolicyMapper odrlPolicyMapper;

    private PolicyService policyService;

    @BeforeEach
    void setUp() {
        policyService = new PolicyService(
                policyRepository,
                policyMapper,
                policyValidator,
                odrlPolicyMapper
        );
    }

    @Test
    void getAllPolicies_returnsMappedPolicies() throws Exception {
        PolicyEntity entity = createEntity();
        Policy policy = createPolicy();

        Pageable pageable = PageRequest.of(0, 20);

        Page<PolicyEntity> entityPage =
                new PageImpl<>(
                        List.of(entity),
                        pageable,
                        1
                );

        when(policyRepository.findAll(pageable))
                .thenReturn(entityPage);

        when(policyMapper.toDomain(entity))
                .thenReturn(policy);

        Page<PolicyResponse> result =
                policyService.getAllPolicies(pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals(1, result.getTotalPages());
        assertEquals(0, result.getNumber());
        assertEquals(20, result.getSize());

        PolicyResponse response =
                result.getContent().getFirst();

        assertEquals(ID, response.getId());
        assertEquals(
                "zugriff-konsortium-mitglieder",
                response.getPolicyId()
        );
        assertEquals(
                PolicyCategory.ACCESS,
                response.getCategory()
        );
        assertEquals(
                "Legal Text",
                response.getLegalText()
        );

        verify(policyRepository).findAll(pageable);
        verify(policyMapper).toDomain(entity);
    }

    @Test
    void getAllPolicies_passesPageableToRepository() {
        Pageable pageable = PageRequest.of(2, 5);

        when(policyRepository.findAll(pageable))
                .thenReturn(Page.empty(pageable));

        Page<PolicyResponse> result =
                policyService.getAllPolicies(pageable);

        assertTrue(result.isEmpty());

        verify(policyRepository).findAll(pageable);
    }

    @Test
    void getPolicyById_returnsPolicyWhenFound() throws Exception {
        PolicyEntity entity = createEntity();
        Policy policy = createPolicy();

        when(policyRepository.findById(ID))
                .thenReturn(Optional.of(entity));
        when(policyMapper.toDomain(entity))
                .thenReturn(policy);

        PolicyResponse result =
                policyService.getPolicyById(ID);

        assertEquals(ID, result.getId());
        assertEquals(
                "zugriff-konsortium-mitglieder",
                result.getPolicyId()
        );

        verify(policyRepository).findById(ID);
        verify(policyMapper).toDomain(entity);
    }

    @Test
    void getPolicyById_throwsWhenPolicyDoesNotExist() {
        when(policyRepository.findById(ID))
                .thenReturn(Optional.empty());

        assertThrows(
                PolicyNotFoundException.class,
                () -> policyService.getPolicyById(ID)
        );

        verify(policyRepository).findById(ID);
        verifyNoInteractions(policyMapper);
    }

    @Test
    void getOdrlPolicyDefinitionById_returnsMappedOdrlPolicy()
            throws Exception {
        PolicyEntity entity = createEntity();
        Policy policy = createPolicy();

        OdrlPolicyDefinitionResponse odrlResponse =
                mock(OdrlPolicyDefinitionResponse.class);

        when(policyRepository.findById(ID))
                .thenReturn(Optional.of(entity));
        when(policyMapper.toDomain(entity))
                .thenReturn(policy);
        when(odrlPolicyMapper.policyToOdrl(policy))
                .thenReturn(odrlResponse);

        OdrlPolicyDefinitionResponse result =
                policyService.getOdrlPolicyDefinitionById(ID);

        assertSame(odrlResponse, result);

        verify(policyRepository).findById(ID);
        verify(policyMapper).toDomain(entity);
        verify(odrlPolicyMapper).policyToOdrl(policy);
    }

    @Test
    void getOdrlPolicyDefinitionById_throwsWhenPolicyDoesNotExist() {
        when(policyRepository.findById(ID))
                .thenReturn(Optional.empty());

        assertThrows(
                PolicyNotFoundException.class,
                () -> policyService.getOdrlPolicyDefinitionById(ID)
        );

        verify(policyRepository).findById(ID);
        verifyNoInteractions(policyMapper, odrlPolicyMapper);
    }

    @Test
    void createPolicy_validatesAndSavesPolicy() throws Exception {
        JsonNode constraint = membershipConstraint();

        CreatePolicyRequest request =
                new CreatePolicyRequest(
                        "zugriff-konsortium-mitglieder",
                        PolicyCategory.ACCESS,
                        List.of(constraint),
                        "Legal Text"
                );

        PolicyEntity entity = createEntity();
        PolicyEntity savedEntity = createEntity();
        Policy savedPolicy = createPolicy();

        when(policyRepository.existsByPolicyId(
                request.policyId()
        )).thenReturn(false);

        when(policyMapper.toEntity(any(Policy.class)))
                .thenReturn(entity);

        when(policyRepository.save(entity))
                .thenReturn(savedEntity);

        when(policyMapper.toDomain(savedEntity))
                .thenReturn(savedPolicy);

        PolicyResponse result =
                policyService.createPolicy(request);

        assertEquals(ID, result.getId());
        assertEquals(
                request.policyId(),
                result.getPolicyId()
        );

        verify(policyValidator).validate(
                request.category(),
                request.constraints()
        );

        verify(policyRepository)
                .existsByPolicyId(request.policyId());

        verify(policyMapper)
                .toEntity(any(Policy.class));

        verify(policyRepository)
                .save(entity);
    }

    @Test
    void createPolicy_throwsWhenPolicyIdAlreadyExists()
            throws Exception {
        CreatePolicyRequest request =
                new CreatePolicyRequest(
                        "duplicate-policy",
                        PolicyCategory.ACCESS,
                        List.of(membershipConstraint()),
                        "Legal Text"
                );

        when(policyRepository.existsByPolicyId(
                request.policyId()
        )).thenReturn(true);

        assertThrows(
                DuplicatePolicyIdException.class,
                () -> policyService.createPolicy(request)
        );

        verify(policyValidator).validate(
                request.category(),
                request.constraints()
        );

        verify(policyRepository)
                .existsByPolicyId(request.policyId());

        verify(policyRepository, never())
                .save(any());

        verify(policyMapper, never())
                .toEntity(any());
    }

    @Test
    void updatePolicy_validatesAndUpdatesExistingPolicy()
            throws Exception {
        JsonNode constraint = membershipConstraint();

        UpdatePolicyRequest request =
                new UpdatePolicyRequest(
                        "updated-policy",
                        PolicyCategory.ACCESS,
                        List.of(constraint),
                        "Updated Legal Text"
                );

        PolicyEntity entity = createEntity();

        Policy updatedPolicy = new Policy(
                ID,
                request.policyId(),
                request.category(),
                request.constraints(),
                request.legalText(),
                CREATED_AT,
                UPDATED_AT
        );

        when(policyRepository.findById(ID))
                .thenReturn(Optional.of(entity));

        when(policyRepository.findByPolicyId(
                request.policyId()
        )).thenReturn(Optional.empty());

        when(policyRepository.save(entity))
                .thenReturn(entity);

        when(policyMapper.toDomain(entity))
                .thenReturn(updatedPolicy);

        PolicyResponse result =
                policyService.updatePolicy(ID, request);

        assertEquals(
                "updated-policy",
                result.getPolicyId()
        );
        assertEquals(
                "Updated Legal Text",
                result.getLegalText()
        );

        verify(policyValidator).validate(
                request.category(),
                request.constraints()
        );

        verify(policyMapper)
                .updateEntity(request, entity);

        verify(policyRepository)
                .save(entity);
    }

    @Test
    void updatePolicy_allowsKeepingOwnPolicyId()
            throws Exception {
        UpdatePolicyRequest request =
                new UpdatePolicyRequest(
                        "zugriff-konsortium-mitglieder",
                        PolicyCategory.ACCESS,
                        List.of(membershipConstraint()),
                        "Legal Text"
                );

        PolicyEntity entity = createEntity();

        when(policyRepository.findById(ID))
                .thenReturn(Optional.of(entity));

        when(policyRepository.findByPolicyId(
                request.policyId()
        )).thenReturn(Optional.of(entity));

        when(policyRepository.save(entity))
                .thenReturn(entity);

        when(policyMapper.toDomain(entity))
                .thenReturn(createPolicy());

        assertDoesNotThrow(
                () -> policyService.updatePolicy(ID, request)
        );

        verify(policyMapper)
                .updateEntity(request, entity);

        verify(policyRepository)
                .save(entity);
    }

    @Test
    void updatePolicy_throwsWhenPolicyIdBelongsToAnotherPolicy()
            throws Exception {
        UUID otherId =
                UUID.fromString(
                        "00000000-0000-0000-0000-000000000002"
                );

        UpdatePolicyRequest request =
                new UpdatePolicyRequest(
                        "other-policy",
                        PolicyCategory.ACCESS,
                        List.of(membershipConstraint()),
                        "Legal Text"
                );

        PolicyEntity entity = createEntity();
        PolicyEntity otherEntity = createEntity();
        otherEntity.setId(otherId);

        when(policyRepository.findById(ID))
                .thenReturn(Optional.of(entity));

        when(policyRepository.findByPolicyId(
                request.policyId()
        )).thenReturn(Optional.of(otherEntity));

        assertThrows(
                DuplicatePolicyIdException.class,
                () -> policyService.updatePolicy(ID, request)
        );

        verify(policyMapper, never())
                .updateEntity(any(), any());

        verify(policyRepository, never())
                .save(any());
    }

    @Test
    void updatePolicy_throwsWhenPolicyDoesNotExist()
            throws Exception {
        UpdatePolicyRequest request =
                new UpdatePolicyRequest(
                        "updated-policy",
                        PolicyCategory.ACCESS,
                        List.of(membershipConstraint()),
                        "Legal Text"
                );

        when(policyRepository.findById(ID))
                .thenReturn(Optional.empty());

        assertThrows(
                PolicyNotFoundException.class,
                () -> policyService.updatePolicy(ID, request)
        );

        verify(policyValidator).validate(
                request.category(),
                request.constraints()
        );

        verify(policyRepository).findById(ID);

        verify(policyRepository, never())
                .save(any());
    }

    @Test
    void deletePolicy_deletesExistingPolicy()
            throws Exception {
        PolicyEntity entity = createEntity();

        when(policyRepository.findById(ID))
                .thenReturn(Optional.of(entity));

        policyService.deletePolicy(ID);

        verify(policyRepository).findById(ID);
        verify(policyRepository).delete(entity);
    }

    @Test
    void deletePolicy_throwsWhenPolicyDoesNotExist() {
        when(policyRepository.findById(ID))
                .thenReturn(Optional.empty());

        assertThrows(
                PolicyNotFoundException.class,
                () -> policyService.deletePolicy(ID)
        );

        verify(policyRepository).findById(ID);
        verify(policyRepository, never())
                .delete(any());
    }

    private Policy createPolicy() throws Exception {
        return new Policy(
                ID,
                "zugriff-konsortium-mitglieder",
                PolicyCategory.ACCESS,
                List.of(membershipConstraint()),
                "Legal Text",
                CREATED_AT,
                UPDATED_AT
        );
    }

    private PolicyEntity createEntity() throws Exception {
        PolicyEntity entity = new PolicyEntity();

        entity.setId(ID);
        entity.setPolicyId(
                "zugriff-konsortium-mitglieder"
        );
        entity.setCategory(PolicyCategory.ACCESS);
        entity.setConstraints(
                List.of(membershipConstraint())
        );
        entity.setLegalText("Legal Text");
        entity.setCreatedAt(CREATED_AT);
        entity.setUpdatedAt(UPDATED_AT);

        return entity;
    }

    private JsonNode membershipConstraint()
            throws Exception {
        return objectMapper.readTree("""
                {
                  "type": "MEMBERSHIP",
                  "value": "active"
                }
                """);
    }
}