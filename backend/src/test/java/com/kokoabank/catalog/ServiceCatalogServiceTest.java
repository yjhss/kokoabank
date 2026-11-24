package com.kokoabank.catalog;

import com.kokoabank.catalog.dto.ServiceRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ServiceCatalogServiceTest {

    @Mock
    private ServiceCatalogRepository repository;

    private ServiceCatalogService service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        service = new ServiceCatalogService(repository);
    }

    private ServiceRequest request(String key) {
        return new ServiceRequest(
                key,
                "Banking API",
                "Banking workload",
                ServiceType.BACKEND,
                "",
                "KokoaBank"
        );
    }

    @Test
    void duplicateServiceKeyIsRejected() {
        when(repository.existsByServiceKey("banking-api"))
                .thenReturn(true);

        assertThrows(
                ResponseStatusException.class,
                () -> service.create(request("banking-api"))
        );

        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void nonExistingServiceReturnsNotFound() {
        when(repository.findById(999L))
                .thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.findById(999L)
        );

        assertEquals(404, exception.getStatusCode().value());
    }

    @Test
    void serviceKeyCannotBeChanged() {
        ServiceCatalog existing = new ServiceCatalog(
                "banking-api",
                "Banking API",
                "Original description",
                ServiceType.BACKEND,
                "",
                "KokoaBank"
        );

        when(repository.findById(1L))
                .thenReturn(Optional.of(existing));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.update(1L, request("changed-key"))
        );

        assertEquals(400, exception.getStatusCode().value());
        verify(repository, never()).flush();
    }
}
