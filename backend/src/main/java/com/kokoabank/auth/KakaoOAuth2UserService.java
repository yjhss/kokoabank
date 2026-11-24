package com.kokoabank.auth;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.*;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.*;
import org.springframework.stereotype.Service;

@Service
public class KakaoOAuth2UserService
        implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final DefaultOAuth2UserService delegate =
            new DefaultOAuth2UserService();

    private final PlatformUserRepository repository;

    public KakaoOAuth2UserService(PlatformUserRepository repository) {
        this.repository = repository;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request)
            throws OAuth2AuthenticationException {

        OAuth2User kakaoUser = delegate.loadUser(request);
        Map<String, Object> attributes = kakaoUser.getAttributes();

        Object rawId = attributes.get("id");

        if (!(rawId instanceof Number id)) {
            throw new OAuth2AuthenticationException(
                    "Kakao user ID is missing"
            );
        }

        Long kakaoId = id.longValue();

        PlatformUser user = repository.findByKakaoId(kakaoId)
                .orElseGet(() -> {
                    // 경쟁 요청은 DB UNIQUE 제약조건으로 최종 차단한다.
                    return repository.saveAndFlush(
                            new PlatformUser(kakaoId)
                    );
                });

        List<SimpleGrantedAuthority> authorities =
                new ArrayList<>();

        authorities.add(new SimpleGrantedAuthority(
                "ROLE_" + user.getRole().name()
        ));

        return new DefaultOAuth2User(
                authorities,
                attributes,
                "id"
        );
    }
}
