package com.kokoabank.catalog;

import com.kokoabank.catalog.dto.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class ServiceCatalogService {

    private final ServiceCatalogRepository repository;

    public ServiceCatalogService(ServiceCatalogRepository repository) {
        this.repository = repository;
    }

    public List<ServiceResponse> findAll() {
        return repository.findAll().stream()
                .map(ServiceResponse::from)
                .toList();
    }

    public ServiceResponse findById(Long id) {
        return ServiceResponse.from(getEntity(id));
    }

    @Transactional
    public ServiceResponse create(ServiceRequest request) {
        if (repository.existsByServiceKey(request.serviceKey())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Service key already exists"
            );
        }

        ServiceCatalog service = new ServiceCatalog(
                request.serviceKey(),
                request.name(),
                request.description(),
                request.serviceType(),
                request.repositoryUrl(),
                request.owner()
        );

        return ServiceResponse.from(repository.saveAndFlush(service));
    }

    @Transactional
    public ServiceResponse update(Long id, ServiceRequest request) {
        ServiceCatalog service = getEntity(id);

        if (!service.getServiceKey().equals(request.serviceKey())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Service key cannot be changed"
            );
        }

        service.update(
                request.name(),
                request.description(),
                request.serviceType(),
                request.repositoryUrl(),
                request.owner()
        );

        repository.flush();
        return ServiceResponse.from(service);
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(getEntity(id));
    }

    private ServiceCatalog getEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Service not found"
                ));
    }
}
