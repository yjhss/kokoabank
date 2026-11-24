package com.kokoabank.auth;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "platform_users")
public class PlatformUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "kakao_id", nullable = false, unique = true)
    private Long kakaoId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PlatformRole role = PlatformRole.USER;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected PlatformUser() {}

    public PlatformUser(Long kakaoId) {
        this.kakaoId = kakaoId;
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

    public Long getId() { return id; }
    public Long getKakaoId() { return kakaoId; }
    public PlatformRole getRole() { return role; }
}
