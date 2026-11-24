package com.kokoabank.catalog.dto;

import com.kokoabank.catalog.ServiceType;
import jakarta.validation.constraints.*;
import org.hibernate.validator.constraints.URL;

public record ServiceRequest(
        @NotBlank
        @Pattern(regexp = "[a-z0-9]+(?:-[a-z0-9]+)*")
        @Size(max = 80)
        String serviceKey,

        @NotBlank
        @Size(max = 120)
        String name,

        @Size(max = 500)
        String description,

        @NotNull
        ServiceType serviceType,

        @Size(max = 500)
        String repositoryUrl,

        @Size(max = 120)
        String owner
) {}
