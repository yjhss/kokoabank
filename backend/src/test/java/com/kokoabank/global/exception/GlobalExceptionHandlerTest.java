package com.kokoabank.global.exception;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import org.springframework.web.bind.annotation.*;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {

        mockMvc = MockMvcBuilders
                .standaloneSetup(new TestController())
                .setControllerAdvice(
                        new GlobalExceptionHandler()
                )
                .build();
    }

    @Test
    void businessExceptionReturnsErrorResponse()
            throws Exception {

        mockMvc.perform(get("/test/account"))
                .andExpect(status().isNotFound())
                .andExpect(
                        jsonPath("$.success").value(false)
                )
                .andExpect(
                        jsonPath("$.code")
                                .value("ACCOUNT_NOT_FOUND")
                );
    }

    @Test
    void invalidInputReturnsBadRequest()
            throws Exception {

        mockMvc.perform(
                        post("/test/validation")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                    {"name": ""}
                    """)
                )
                .andExpect(status().isBadRequest())
                .andExpect(
                        jsonPath("$.code")
                                .value("INVALID_INPUT")
                );
    }

    @Test
    void internalErrorDoesNotExposeDetails()
            throws Exception {

        mockMvc.perform(get("/test/error"))
                .andExpect(status().isInternalServerError())
                .andExpect(
                        jsonPath("$.code")
                                .value("INTERNAL_SERVER_ERROR")
                )
                .andExpect(
                        jsonPath("$.message")
                                .value("서버 내부 오류가 발생했습니다.")
                );
    }

    @RestController
    static class TestController {

        @GetMapping("/test/account")
        public void account() {

            throw new BusinessException(
                    ErrorCode.ACCOUNT_NOT_FOUND
            );
        }

        @PostMapping("/test/validation")
        public void validate(
                @Valid @RequestBody TestRequest request
        ) {
        }

        @GetMapping("/test/error")
        public void error() {

            throw new RuntimeException(
                    "internal error details"
            );
        }
    }

    record TestRequest(
            @NotBlank String name
    ) {
    }
}
