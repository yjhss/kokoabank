package com.kokoabank.banking;

import jakarta.validation.Valid;

import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import static com.kokoabank.banking.BankingDtos.*;

@RestController
@Profile("local")
@RequestMapping("/api/banking/dev")
public class BankingDevController {

    private final BankingService bankingService;

    public BankingDevController(BankingService bankingService) {
        this.bankingService = bankingService;
    }

    @PostMapping("/fund")
    public DemoFundingResponse fund(
            Authentication authentication,
            @Valid @RequestBody DemoFundingRequest request
    ) {
        boolean allowed = authentication != null
                && authentication.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role ->
                        "ROLE_ADMIN".equals(role)
                        || "ROLE_OPERATOR".equals(role)
                );

        if (!allowed) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Operator permission required"
            );
        }

        long kakaoId;

        try {
            kakaoId = Long.parseLong(authentication.getName());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid authenticated user"
            );
        }

        return bankingService.fundDemoAccount(
                kakaoId,
                request
        );
    }
}