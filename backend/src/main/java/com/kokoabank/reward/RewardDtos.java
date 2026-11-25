package com.kokoabank.reward;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class RewardDtos {

    private RewardDtos() {
    }

    public record RewardDrawResponse(
            Long id,
            int cashbackRate,
            String status,
            Instant createdAt
    ) {
    }

    public record CardPaymentRequest(
            @NotNull
            Long accountId,

            @NotNull
            Long rewardDrawId,

            @Positive
            long amount,

            @NotBlank
            @Size(max = 100)
            String merchantName
    ) {
    }

    public record CardPaymentResponse(
            Long id,
            Long accountId,
            Long rewardDrawId,
            String merchantName,
            long amount,
            int cashbackRate,
            long cashbackAmount,
            long balanceAfter,
            String status,
            boolean replayed
    ) {
    }

    public record CardPaymentLedgerResponse(
            Long id,
            Long paymentId,
            String entryType,
            long amount,
            long balanceAfter,
            Instant createdAt
    ) {
    }
}
