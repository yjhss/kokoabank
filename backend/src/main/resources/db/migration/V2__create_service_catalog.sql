
CREATE TABLE service_catalog (
    id BIGSERIAL PRIMARY KEY,
    service_key VARCHAR(80) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(500),
    service_type VARCHAR(30) NOT NULL,
    repository_url VARCHAR(500),
    owner VARCHAR(120),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_service_catalog_type
        CHECK (service_type IN ('BACKEND', 'FRONTEND', 'WORKER'))
);

CREATE INDEX idx_service_catalog_type
    ON service_catalog(service_type);
