package com.kokoabank.health.controller;

import com.kokoabank.global.response.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api")
@Tag(name = "Health", description = "서비스 상태 확인 API")
public class HealthController {

    @GetMapping("/health")
    @Operation(summary = "API 서버 상태 확인")
    public ApiResponse<Map<String, Object>> health() {

        return ApiResponse.ok(
                Map.of(
                        "service", "kokoabank-backend",
                        "status", "UP",
                        "timestamp", Instant.now().toString()
                )
        );
    }
}
