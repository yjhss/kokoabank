package com.kokoabank.catalog;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceCatalogRepository
        extends JpaRepository<ServiceCatalog, Long> {

    boolean existsByServiceKey(String serviceKey);
}
