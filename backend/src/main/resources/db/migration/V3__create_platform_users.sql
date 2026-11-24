CREATE TABLE platform_users (
    id BIGSERIAL PRIMARY KEY,
    kakao_id BIGINT NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_platform_user_role
        CHECK (role IN (
            'USER',
            'DEVELOPER',
            'OPERATOR',
            'ADMIN'
        ))
);

CREATE INDEX idx_platform_users_role
    ON platform_users(role);
