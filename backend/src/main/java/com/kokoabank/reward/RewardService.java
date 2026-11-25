package com.kokoabank.reward;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import static com.kokoabank.reward.RewardDtos.*;

@Service
public class RewardService {

    private static final int[] CASHBACK_RATES = {1, 2, 3, 5};

    private final JdbcTemplate jdbc;
    private final SecureRandom random = new SecureRandom();

    public RewardService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private record AccountRow(
            long id,
            long userId,
            long balance,
            String status
    ) {
    }

    private record PaymentRow(
            long id,
            long accountId,
            long rewardDrawId,
            String merchantName,
            long amount,
            int cashbackRate,
            long cashbackAmount,
            String status
    ) {
    }

    private ResponseStatusException fail(
            HttpStatus status,
            String message
    ) {
        return new ResponseStatusException(status, message);
    }

    private long platformUserId(long kakaoId) {
        List<Long> ids = jdbc.queryForList(
                """
                SELECT id
                FROM platform_users
                WHERE kakao_id = ?
                """,
                Long.class,
                kakaoId
        );

        if (ids.isEmpty()) {
            throw fail(
                    HttpStatus.UNAUTHORIZED,
                    "Platform user not found"
            );
        }

        return ids.getFirst();
    }

    private long bankingUserId(long platformUserId) {
        List<Long> ids = jdbc.queryForList(
                """
                SELECT banking_user_id
                FROM banking_user_links
                WHERE platform_user_id = ?
                """,
                Long.class,
                platformUserId
        );

        if (ids.isEmpty()) {
            throw fail(
                    HttpStatus.NOT_FOUND,
                    "Create a banking account first"
            );
        }

        return ids.getFirst();
    }

    private RewardDrawResponse mapDraw(
            ResultSet rs,
            int rowNum
    ) throws SQLException {
        return new RewardDrawResponse(
                rs.getLong("id"),
                rs.getInt("cashback_rate"),
                rs.getString("status"),
                rs.getTimestamp("created_at").toInstant()
        );
    }

    private Optional<RewardDrawResponse> findAvailableDraw(
            long platformUserId
    ) {
        return jdbc.query(
                """
                SELECT id, cashback_rate, status, created_at
                FROM reward_draws
                WHERE platform_user_id = ?
                  AND status = 'AVAILABLE'
                ORDER BY id DESC
                LIMIT 1
                """,
                this::mapDraw,
                platformUserId
        ).stream().findFirst();
    }

    @Transactional(readOnly = true)
    public Optional<RewardDrawResponse> getAvailableDraw(
            long kakaoId
    ) {
        return findAvailableDraw(platformUserId(kakaoId));
    }

    @Transactional
    public RewardDrawResponse draw(long kakaoId) {
        long userId = platformUserId(kakaoId);

        // Serialize concurrent draw requests for this user.
        jdbc.query(
                """
                SELECT id
                FROM platform_users
                WHERE id = ?
                FOR UPDATE
                """,
                (rs, rowNum) -> rs.getLong("id"),
                userId
        );

        Optional<RewardDrawResponse> existing =
                findAvailableDraw(userId);

        if (existing.isPresent()) {
            return existing.get();
        }

        int cashbackRate = CASHBACK_RATES[
                random.nextInt(CASHBACK_RATES.length)
        ];

        List<RewardDrawResponse> created = jdbc.query(
                """
                INSERT INTO reward_draws (
                    platform_user_id,
                    cashback_rate,
                    status
                )
                VALUES (?, ?, 'AVAILABLE')
                RETURNING id, cashback_rate, status, created_at
                """,
                this::mapDraw,
                userId,
                cashbackRate
        );

        return created.getFirst();
    }

    private AccountRow mapAccount(
            ResultSet rs,
            int rowNum
    ) throws SQLException {
        return new AccountRow(
                rs.getLong("id"),
                rs.getLong("user_id"),
                rs.getLong("balance"),
                rs.getString("status")
        );
    }

    private Optional<PaymentRow> findPaymentByKey(
            String key
    ) {
        return jdbc.query(
                """
                SELECT
                    id,
                    account_id,
                    reward_draw_id,
                    merchant_name,
                    amount,
                    cashback_rate,
                    cashback_amount,
                    status
                FROM card_payments
                WHERE idempotency_key = ?
                """,
                (rs, rowNum) -> new PaymentRow(
                        rs.getLong("id"),
                        rs.getLong("account_id"),
                        rs.getLong("reward_draw_id"),
                        rs.getString("merchant_name"),
                        rs.getLong("amount"),
                        rs.getInt("cashback_rate"),
                        rs.getLong("cashback_amount"),
                        rs.getString("status")
                ),
                key
        ).stream().findFirst();
    }

    private long paymentBalanceAfter(long paymentId) {
        List<Long> balances = jdbc.queryForList(
                """
                SELECT balance_after
                FROM card_payment_ledger
                WHERE payment_id = ?
                  AND entry_type = 'CASHBACK'
                """,
                Long.class,
                paymentId
        );

        if (balances.isEmpty()) {
            throw fail(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Cashback ledger is missing"
            );
        }

        return balances.getFirst();
    }

    private CardPaymentResponse toPaymentResponse(
            PaymentRow payment,
            boolean replayed
    ) {
        return new CardPaymentResponse(
                payment.id(),
                payment.accountId(),
                payment.rewardDrawId(),
                payment.merchantName(),
                payment.amount(),
                payment.cashbackRate(),
                payment.cashbackAmount(),
                paymentBalanceAfter(payment.id()),
                payment.status(),
                replayed
        );
    }

    private CardPaymentResponse replay(
            PaymentRow payment,
            CardPaymentRequest request,
            long userId
    ) {
        List<Long> owned = jdbc.queryForList(
                """
                SELECT a.id
                FROM accounts a
                WHERE a.id = ?
                  AND a.user_id = ?
                """,
                Long.class,
                payment.accountId(),
                userId
        );

        if (owned.isEmpty()) {
            throw fail(
                    HttpStatus.CONFLICT,
                    "Idempotency key is unavailable"
            );
        }

        if (
                payment.accountId() != request.accountId()
                || payment.rewardDrawId() != request.rewardDrawId()
                || payment.amount() != request.amount()
                || !Objects.equals(
                        payment.merchantName(),
                        request.merchantName().trim()
                )
        ) {
            throw fail(
                    HttpStatus.CONFLICT,
                    "Idempotency key belongs to another request"
            );
        }

        return toPaymentResponse(payment, true);
    }

    @Transactional
    public CardPaymentResponse pay(
            long kakaoId,
            CardPaymentRequest request,
            String idempotencyKey
    ) {
        if (request.amount() < 1000 || request.amount() > 100000) {
            throw fail(
                    HttpStatus.BAD_REQUEST,
                    "Payment amount must be between 1000 and 100000"
            );
        }

        if (
                idempotencyKey == null
                || idempotencyKey.isBlank()
                || idempotencyKey.length() > 100
        ) {
            throw fail(
                    HttpStatus.BAD_REQUEST,
                    "Invalid idempotency key"
            );
        }

        String merchantName = request.merchantName().trim();

        if (merchantName.isEmpty()) {
            throw fail(
                    HttpStatus.BAD_REQUEST,
                    "Merchant name is required"
            );
        }

        long userId = bankingUserId(platformUserId(kakaoId));

        List<AccountRow> accounts = jdbc.query(
                """
                SELECT id, user_id, balance, status
                FROM accounts
                WHERE id = ?
                FOR UPDATE
                """,
                this::mapAccount,
                request.accountId()
        );

        if (
                accounts.isEmpty()
                || accounts.getFirst().userId() != userId
        ) {
            throw fail(
                    HttpStatus.NOT_FOUND,
                    "Account not found"
            );
        }

        AccountRow account = accounts.getFirst();

        Optional<PaymentRow> existing =
                findPaymentByKey(idempotencyKey);

        if (existing.isPresent()) {
            return replay(existing.get(), request, userId);
        }

        if (!"ACTIVE".equals(account.status())) {
            throw fail(
                    HttpStatus.CONFLICT,
                    "Account is not active"
            );
        }

        List<Integer> rates = jdbc.queryForList(
                """
                SELECT cashback_rate
                FROM reward_draws
                WHERE id = ?
                  AND platform_user_id = ?
                  AND status = 'AVAILABLE'
                FOR UPDATE
                """,
                Integer.class,
                request.rewardDrawId(),
                platformUserId(kakaoId)
        );

        if (rates.isEmpty()) {
            throw fail(
                    HttpStatus.CONFLICT,
                    "Available cashback reward not found"
            );
        }

        if (account.balance() < request.amount()) {
            throw fail(
                    HttpStatus.CONFLICT,
                    "Insufficient balance"
            );
        }

        int rate = rates.getFirst();

        long cashback = Math.min(
                request.amount() * rate / 100,
                1000L
        );

        if (cashback <= 0) {
            throw fail(
                    HttpStatus.BAD_REQUEST,
                    "Cashback calculation failed"
            );
        }

        List<Long> insertedIds = jdbc.queryForList(
                """
                INSERT INTO card_payments (
                    account_id,
                    reward_draw_id,
                    merchant_name,
                    amount,
                    cashback_rate,
                    cashback_amount,
                    idempotency_key,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, 'COMPLETED')
                ON CONFLICT (idempotency_key) DO NOTHING
                RETURNING id
                """,
                Long.class,
                account.id(),
                request.rewardDrawId(),
                merchantName,
                request.amount(),
                rate,
                cashback,
                idempotencyKey
        );

        if (insertedIds.isEmpty()) {
            PaymentRow duplicate = findPaymentByKey(idempotencyKey)
                    .orElseThrow(() -> fail(
                            HttpStatus.CONFLICT,
                            "Concurrent payment conflict"
                    ));

            return replay(duplicate, request, userId);
        }

        long paymentId = insertedIds.getFirst();

        long afterPayment = account.balance() - request.amount();
        long finalBalance = afterPayment + cashback;

        int updated = jdbc.update(
                """
                UPDATE accounts
                SET balance = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                finalBalance,
                account.id()
        );

        if (updated != 1) {
            throw fail(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Account update failed"
            );
        }

        jdbc.update(
                """
                INSERT INTO card_payment_ledger (
                    payment_id,
                    account_id,
                    entry_type,
                    amount,
                    balance_after
                )
                VALUES (?, ?, 'PAYMENT', ?, ?)
                """,
                paymentId,
                account.id(),
                request.amount(),
                afterPayment
        );

        jdbc.update(
                """
                INSERT INTO card_payment_ledger (
                    payment_id,
                    account_id,
                    entry_type,
                    amount,
                    balance_after
                )
                VALUES (?, ?, 'CASHBACK', ?, ?)
                """,
                paymentId,
                account.id(),
                cashback,
                finalBalance
        );

        jdbc.update(
                """
                UPDATE reward_draws
                SET status = 'USED',
                    used_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                request.rewardDrawId()
        );

        return new CardPaymentResponse(
                paymentId,
                account.id(),
                request.rewardDrawId(),
                merchantName,
                request.amount(),
                rate,
                cashback,
                finalBalance,
                "COMPLETED",
                false
        );
    }

    @Transactional(readOnly = true)
    public List<CardPaymentResponse> payments(long kakaoId) {
        long platformId = platformUserId(kakaoId);

        List<Long> userIds = jdbc.queryForList(
                """
                SELECT banking_user_id
                FROM banking_user_links
                WHERE platform_user_id = ?
                """,
                Long.class,
                platformId
        );

        if (userIds.isEmpty()) {
            return List.of();
        }

        return jdbc.query(
                """
                SELECT
                    p.id,
                    p.account_id,
                    p.reward_draw_id,
                    p.merchant_name,
                    p.amount,
                    p.cashback_rate,
                    p.cashback_amount,
                    p.status
                FROM card_payments p
                JOIN accounts a ON a.id = p.account_id
                WHERE a.user_id = ?
                ORDER BY p.created_at DESC, p.id DESC
                LIMIT 50
                """,
                (rs, rowNum) -> new PaymentRow(
                        rs.getLong("id"),
                        rs.getLong("account_id"),
                        rs.getLong("reward_draw_id"),
                        rs.getString("merchant_name"),
                        rs.getLong("amount"),
                        rs.getInt("cashback_rate"),
                        rs.getLong("cashback_amount"),
                        rs.getString("status")
                ),
                userIds.getFirst()
        ).stream().map(payment ->
                toPaymentResponse(payment, false)
        ).toList();
    }

    @Transactional(readOnly = true)
    public List<CardPaymentLedgerResponse> ledger(
            long kakaoId,
            long accountId
    ) {
        long userId = bankingUserId(platformUserId(kakaoId));

        List<Long> owned = jdbc.queryForList(
                """
                SELECT id
                FROM accounts
                WHERE id = ?
                  AND user_id = ?
                """,
                Long.class,
                accountId,
                userId
        );

        if (owned.isEmpty()) {
            throw fail(
                    HttpStatus.NOT_FOUND,
                    "Account not found"
            );
        }

        return jdbc.query(
                """
                SELECT
                    id,
                    payment_id,
                    entry_type,
                    amount,
                    balance_after,
                    created_at
                FROM card_payment_ledger
                WHERE account_id = ?
                ORDER BY id DESC
                LIMIT 100
                """,
                (rs, rowNum) -> new CardPaymentLedgerResponse(
                        rs.getLong("id"),
                        rs.getLong("payment_id"),
                        rs.getString("entry_type"),
                        rs.getLong("amount"),
                        rs.getLong("balance_after"),
                        rs.getTimestamp("created_at").toInstant()
                ),
                accountId
        );
    }
}