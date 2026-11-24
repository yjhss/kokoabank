package com.kokoabank.banking;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.kokoabank.banking.BankingDtos.*;

@RestController
@RequestMapping("/api/banking")
public class BankingController {

    private final BankingService bankingService;

    public BankingController(BankingService bankingService) {
        this.bankingService = bankingService;
    }

    private long kakaoId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required"
            );
        }

        try {
            return Long.parseLong(authentication.getName());
        } catch (NumberFormatException exception) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid authenticated user"
            );
        }
    }

    @PostMapping("/accounts")
    public ResponseEntity<AccountResponse> createAccount(
            Authentication authentication,
            @Valid @RequestBody AccountCreateRequest request
    ) {
        AccountResponse result = bankingService.createAccount(
                kakaoId(authentication),
                request
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(result);
    }

    @GetMapping("/accounts")
    public List<AccountResponse> getAccounts(
            Authentication authentication
    ) {
        return bankingService.getMyAccounts(
                kakaoId(authentication)
        );
    }

    @GetMapping("/accounts/{accountId}")
    public AccountResponse getAccount(
            Authentication authentication,
            @PathVariable long accountId
    ) {
        return bankingService.getMyAccount(
                kakaoId(authentication),
                accountId
        );
    }

    @PostMapping("/transfers")
    public TransferResponse transfer(
            Authentication authentication,
            @RequestHeader("Idempotency-Key")
            @NotBlank
            @Size(max = 100)
            String idempotencyKey,
            @Valid @RequestBody TransferRequest request
    ) {
        return bankingService.transfer(
                kakaoId(authentication),
                request,
                idempotencyKey
        );
    }

    @GetMapping("/transactions")
    public List<TransactionResponse> getTransactions(
            Authentication authentication,
            @RequestParam long accountId
    ) {
        return bankingService.getTransactions(
                kakaoId(authentication),
                accountId
        );
    }
}
