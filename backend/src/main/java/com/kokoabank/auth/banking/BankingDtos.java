package com.kokoabank.banking;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class BankingDtos {

    private BankingDtos() {
    }

    public record AccountCreateRequest(
            @NotBlank
            @Size(max = 100)
            String name
    ) {
    }

    public record AccountResponse(
            Long id,
            String accountNumber,
            String name,
            long balance,
            String status
    ) {
    }

    public record TransferRequest(
            @NotNull
            Long fromAccountId,

            @NotNull
            Long toAccountId,

            @Positive
            long amount,

            @Size(max = 100)
            String memo
    ) {
    }

    public record TransferResponse(
            Long id,
            Long fromAccountId,
            Long toAccountId,
            long amount,
            String status,
            String idempotencyKey,
            boolean replayed
    ) {
    }

    public record TransactionResponse(
            Long id,
            Long accountId,
            Long transferId,
            String type,
            long amount,
            long balanceAfter,
            String description,
            Instant createdAt
    ) {
    }

    public record DemoFundingRequest(
            @NotNull
            Long accountId,

            @Positive
            @Max(100000)
            long amount
    ) {
    }

    public record DemoFundingResponse(
            Long accountId,
            long fundedAmount,
            long balanceAfter
    ) {
    }
}
