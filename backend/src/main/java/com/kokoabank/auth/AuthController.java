package com.kokoabank.auth;

import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @GetMapping("/me")
    public Map<String, Object> me(
            Authentication authentication
    ) {
        String role = authentication
                .getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority ->
                        authority.startsWith("ROLE_")
                )
                .findFirst()
                .map(authority ->
                        authority.substring("ROLE_".length())
                )
                .orElse("USER");

        return Map.of(
                "authenticated", true,
                "username", authentication.getName(),
                "role", role
        );
    }

    @GetMapping("/csrf")
    public Map<String, String> csrf(
            CsrfToken csrfToken
    ) {
        return Map.of(
                "headerName", csrfToken.getHeaderName(),
                "token", csrfToken.getToken()
        );
    }
}
