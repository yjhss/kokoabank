package com.kokoabank.global.exception;

import com.kokoabank.global.response.ErrorResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;

import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.ErrorResponseException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log =
            LoggerFactory.getLogger(
                    GlobalExceptionHandler.class
            );

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(
            BusinessException exception,
            HttpServletRequest request
    ) {
        ErrorCode errorCode = exception.getErrorCode();

        return buildResponse(
                errorCode,
                request
        );
    }

    @ExceptionHandler({
            MethodArgumentNotValidException.class,
            ConstraintViolationException.class,
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class
    })
    public ResponseEntity<ErrorResponse> handleInvalidInput(
            Exception exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                ErrorCode.INVALID_INPUT,
                request
        );
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            NoResourceFoundException exception,
            HttpServletRequest request
    ) {
        return buildResponse(
                ErrorCode.RESOURCE_NOT_FOUND,
                request
        );
    }

    @ExceptionHandler(ErrorResponseException.class)
    public ResponseEntity<ErrorResponse> handleHttpException(
            ErrorResponseException exception,
            HttpServletRequest request
    ) {
        return ResponseEntity
                .status(exception.getStatusCode())
                .headers(exception.getHeaders())
                .body(
                        ErrorResponse.of(
                                "HTTP_" + exception.getStatusCode().value(),
                                "HTTP 요청 처리에 실패했습니다.",
                                request.getRequestURI()
                        )
                );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpectedException(
            Exception exception,
            HttpServletRequest request
    ) {
        log.error(
                "Unexpected server error. path={}, type={}",
                request.getRequestURI(),
                exception.getClass().getSimpleName()
        );

        return buildResponse(
                ErrorCode.INTERNAL_SERVER_ERROR,
                request
        );
    }

    private ResponseEntity<ErrorResponse> buildResponse(
            ErrorCode errorCode,
            HttpServletRequest request
    ) {
        return ResponseEntity
                .status(errorCode.getStatus())
                .body(
                        ErrorResponse.of(
                                errorCode.name(),
                                errorCode.getMessage(),
                                request.getRequestURI()
                        )
                );
    }
}
