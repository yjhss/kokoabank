package com.kokoabank.reward;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static com.kokoabank.reward.RewardDtos.*;

@RestController
@RequestMapping("/api/rewards")
public class RewardController {

    private final RewardService rewardService;

    public RewardController(RewardService rewardService) {
        this.rewardService = rewardService;
    }

    private long kakaoId(Authentication authentication) {
        if (
                authentication == null
                || !authentication.isAuthenticated()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required"
            );
        }

        try {
            return Long.parseLong(authentication.getName());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid authenticated user"
            );
        }
    }

    @GetMapping("/draws/active")
    public ResponseEntity<RewardDrawResponse> activeDraw(
            Authentication authentication
    ) {
        return rewardService.getAvailableDraw(
                kakaoId(authentication)
        ).map(ResponseEntity::ok)
         .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/draws")
    public RewardDrawResponse draw(
            Authentication authentication
    ) {
        return rewardService.draw(kakaoId(authentication));
    }

    @PostMapping("/payments")
    public ResponseEntity<CardPaymentResponse> pay(
            Authentication authentication,
            @RequestHeader("Idempotency-Key") String key,
            @Valid @RequestBody CardPaymentRequest request
    ) {
        CardPaymentResponse result = rewardService.pay(
                kakaoId(authentication),
                request,
                key
        );

        return ResponseEntity
                .status(result.replayed()
                        ? HttpStatus.OK
                        : HttpStatus.CREATED)
                .body(result);
    }

    @GetMapping("/payments")
    public List<CardPaymentResponse> payments(
            Authentication authentication
    ) {
        return rewardService.payments(kakaoId(authentication));
    }

    @GetMapping("/ledger")
    public List<CardPaymentLedgerResponse> ledger(
            Authentication authentication,
            @RequestParam long accountId
    ) {
        return rewardService.ledger(
                kakaoId(authentication),
                accountId
        );
    }
}
