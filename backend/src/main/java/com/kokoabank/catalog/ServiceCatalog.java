package com.kokoabank.catalog;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "service_catalog")
public class ServiceCatalog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "service_key", nullable = false, unique = true, length = 80)
    private String serviceKey;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", nullable = false, length = 30)
    private ServiceType serviceType;

    @Column(name = "repository_url", length = 500)
    private String repositoryUrl;

    @Column(length = 120)
    private String owner;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ServiceCatalog() {}

    public ServiceCatalog(
            String serviceKey,
            String name,
            String description,
            ServiceType serviceType,
            String repositoryUrl,
            String owner
    ) {
        this.serviceKey = serviceKey;
        this.name = name;
        this.description = description;
        this.serviceType = serviceType;
        this.repositoryUrl = repositoryUrl;
        this.owner = owner;
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public void update(
            String name,
            String description,
            ServiceType serviceType,
            String repositoryUrl,
            String owner
    ) {
        this.name = name;
        this.description = description;
        this.serviceType = serviceType;
        this.repositoryUrl = repositoryUrl;
        this.owner = owner;
    }

    public Long getId() { return id; }
    public String getServiceKey() { return serviceKey; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public ServiceType getServiceType() { return serviceType; }
    public String getRepositoryUrl() { return repositoryUrl; }
    public String getOwner() { return owner; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
