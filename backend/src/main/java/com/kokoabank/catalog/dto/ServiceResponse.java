package com.kokoabank.catalog.dto;

import com.kokoabank.catalog.*;
import java.time.Instant;

public record ServiceResponse(
        Long id,
        String serviceKey,
        String name,
        String description,
        ServiceType serviceType,
        String repositoryUrl,
        String owner,
        Instant createdAt,
        Instant updatedAt
) {
    public static ServiceResponse from(ServiceCatalog service) {
        return new ServiceResponse(
                service.getId(),
                service.getServiceKey(),
                service.getName(),
                service.getDescription(),
                service.getServiceType(),
                service.getRepositoryUrl(),
                service.getOwner(),
                service.getCreatedAt(),
                service.getUpdatedAt()
        );
    }
}
