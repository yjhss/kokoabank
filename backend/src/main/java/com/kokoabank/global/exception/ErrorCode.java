package com.kokoabank.global.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {

    INVALID_INPUT(
            HttpStatus.BAD_REQUEST,
            "입력값이 올바르지 않습니다."
    ),

    UNAUTHORIZED(
            HttpStatus.UNAUTHORIZED,
            "인증이 필요합니다."
    ),

    FORBIDDEN(
            HttpStatus.FORBIDDEN,
            "접근 권한이 없습니다."
    ),

    RESOURCE_NOT_FOUND(
            HttpStatus.NOT_FOUND,
            "요청한 리소스를 찾을 수 없습니다."
    ),

    USER_NOT_FOUND(
            HttpStatus.NOT_FOUND,
            "사용자를 찾을 수 없습니다."
    ),

    ACCOUNT_NOT_FOUND(
            HttpStatus.NOT_FOUND,
            "계좌를 찾을 수 없습니다."
    ),

    DUPLICATE_USER(
            HttpStatus.CONFLICT,
            "이미 등록된 사용자입니다."
    ),

    INSUFFICIENT_BALANCE(
            HttpStatus.UNPROCESSABLE_ENTITY,
            "잔액이 부족합니다."
    ),

    INVALID_TRANSFER(
            HttpStatus.BAD_REQUEST,
            "올바르지 않은 이체 요청입니다."
    ),

    INTERNAL_SERVER_ERROR(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "서버 내부 오류가 발생했습니다."
    );

    private final HttpStatus status;
    private final String message;

    ErrorCode(
            HttpStatus status,
            String message
    ) {
        this.status = status;
        this.message = message;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }
}
