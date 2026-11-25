package com.kokoabank.auth;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.util.matcher.RequestHeaderRequestMatcher;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            KakaoOAuth2UserService kakaoUserService
    ) throws Exception {

        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/error",
                    "/api/health",
                    "/actuator/health",
                    "/actuator/health/**",
                    "/actuator/prometheus", 
                    "/swagger-ui/**",
                    "/v3/api-docs/**",
                    "/api/auth/csrf",
                    "/oauth2/**",
                    "/login/oauth2/**"
                ).permitAll()

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/platform/services",
                    "/api/platform/services/**"
                ).hasAnyRole(
                    "DEVELOPER",
                    "OPERATOR",
                    "ADMIN"
                )

                .requestMatchers(
                    "/api/platform/**"
                ).hasAnyRole(
                    "OPERATOR",
                    "ADMIN"
                )

                .requestMatchers(
                    "/api/banking/**"
                ).authenticated()

                .requestMatchers(
                    "/api/auth/me"
                ).authenticated()

                  .requestMatchers(
                    "/api/rewards/**"
                ).authenticated()

                .anyRequest().denyAll()
            )

            .oauth2Login(oauth -> oauth
                .userInfoEndpoint(userInfo ->
                    userInfo.userService(kakaoUserService)
                )
                .successHandler(
                    (request, response, authentication) ->
                        response.sendRedirect(
                            "http://localhost:5173/login"
                        )
                )
                .failureHandler((request, response, exception) -> {
                    System.err.println("========== KAKAO LOGIN FAILED ==========");
                    exception.printStackTrace();
                    System.err.println("========================================");

                    response.sendRedirect(
                        "http://localhost:5173/login?error=oauth"
                    );
                })
            )

            .exceptionHandling(errors -> errors
                .defaultAuthenticationEntryPointFor(
                    new HttpStatusEntryPoint(
                        HttpStatus.UNAUTHORIZED
                    ),
                    request -> request.getRequestURI()
                        .startsWith("/api/")
                )
            )

            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .logoutSuccessHandler(
                    (request, response, authentication) ->
                        response.setStatus(
                            HttpServletResponse.SC_NO_CONTENT
                        )
                )
                .invalidateHttpSession(true)
                .clearAuthentication(true)
                .deleteCookies("JSESSIONID")
            );

        return http.build();
    }
}
