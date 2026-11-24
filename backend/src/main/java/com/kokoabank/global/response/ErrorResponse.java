package com.kokoabank.global.response;

import java.time.Instant;

public record ErrorResponse(
        boolean success,
        String code,
        String message,
        String path,
        Instant timestamp
) {

    public static ErrorResponse of(
            String code,
            String message,
            String path
    ) {
        return new ErrorResponse(
                false,
                code,
                message,
                path,
                Instant.now()
        );
    }
}
