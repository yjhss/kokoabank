package com.kokoabank.banking;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

import static com.kokoabank.banking.BankingDtos.*;

@Service
public class BankingService {

    private final JdbcTemplate jdbc;

    public BankingService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private record LockedAccount(
            long id,
            long userId,
            long balance,
            String status
    ) {
    }

    private record StoredTransfer(
            long id,
            long fromAccountId,
            long toAccountId,
            long amount,
            String memo,
            String status
    ) {
    }

    private ResponseStatusException fail(
            HttpStatus status,
            String message
    ) {
        return new ResponseStatusException(status, message);
    }

    private Long requirePlatformUserId(long kakaoId) {
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

    private Optional<Long> findBankingUserId(long platformUserId) {
        List<Long> ids = jdbc.queryForList(
                """
                SELECT banking_user_id
                FROM banking_user_links
                WHERE platform_user_id = ?
                """,
                Long.class,
                platformUserId
        );

        return ids.stream().findFirst();
    }

    private long getOrCreateBankingUser(long kakaoId) {
        long platformUserId = requirePlatformUserId(kakaoId);

        // Serialize first-time user creation for the same platform user.
        jdbc.queryForObject(
                "SELECT pg_advisory_xact_lock(?::bigint)",
                (rs, rowNum) -> rs.getObject(1),
                1_000_000_000_000L + platformUserId
        );

        Optional<Long> existing = findBankingUserId(platformUserId);

        if (existing.isPresent()) {
            return existing.get();
        }

        String username = "kakao-" + platformUserId;

        Long bankingUserId = jdbc.queryForObject(
                """
                INSERT INTO users (
                    username,
                    password_hash,
                    name
                )
                VALUES (?, ?, ?)
                RETURNING id
                """,
                Long.class,
                username,
                "!OAUTH_LOGIN_ONLY!",
                "KokoaBank Demo User"
        );

        if (bankingUserId == null) {
            throw fail(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Could not create banking user"
            );
        }

        jdbc.update(
                """
                INSERT INTO banking_user_links (
                    platform_user_id,
                    banking_user_id
                )
                VALUES (?, ?)
                """,
                platformUserId,
                bankingUserId
        );

        return bankingUserId;
    }

    private Optional<Long> findMyBankingUser(long kakaoId) {
        long platformUserId = requirePlatformUserId(kakaoId);
        return findBankingUserId(platformUserId);
    }

    private AccountResponse mapAccount(
            ResultSet rs,
            int rowNum
    ) throws SQLException {
        return new AccountResponse(
                rs.getLong("id"),
                rs.getString("account_number"),
                rs.getString("name"),
                rs.getLong("balance"),
                rs.getString("status")
        );
    }

    private Optional<AccountResponse> findAccount(long accountId) {
        return jdbc.query(
                """
                SELECT id, account_number, name, balance, status
                FROM accounts
                WHERE id = ?
                """,
                this::mapAccount,
                accountId
        ).stream().findFirst();
    }

    private long requireOwnedAccountId(
            long kakaoId,
            long accountId
    ) {
        Long bankingUserId = findMyBankingUser(kakaoId)
                .orElseThrow(() -> fail(
                        HttpStatus.NOT_FOUND,
                        "Account not found"
                ));

        List<Long> accounts = jdbc.queryForList(
                """
                SELECT id
                FROM accounts
                WHERE id = ?
                  AND user_id = ?
                """,
                Long.class,
                accountId,
                bankingUserId
        );

        if (accounts.isEmpty()) {
            throw fail(
                    HttpStatus.NOT_FOUND,
                    "Account not found"
            );
        }

        return accountId;
    }

    private String generateAccountNumber() {
        long random = ThreadLocalRandom.current().nextLong(
                100_000_000_000_000_00L,
                100_000_000_000_000_000L
        );

        return "777" + random;
    }

    @Transactional
    public AccountResponse createAccount(
            long kakaoId,
            AccountCreateRequest request
    ) {
        long bankingUserId = getOrCreateBankingUser(kakaoId);

        Long accountId = jdbc.queryForObject(
                """
                INSERT INTO accounts (
                    user_id,
                    account_number,
                    name,
                    balance,
                    status
                )
                VALUES (?, ?, ?, 0, 'ACTIVE')
                RETURNING id
                """,
                Long.class,
                bankingUserId,
                generateAccountNumber(),
                request.name().trim()
        );

        if (accountId == null) {
            throw fail(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Account creation failed"
            );
        }

        return findAccount(accountId)
                .orElseThrow(() -> fail(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "Created account not found"
                ));
    }

    @Transactional(readOnly = true)
    public List<AccountResponse> getMyAccounts(long kakaoId) {
        Optional<Long> userId = findMyBankingUser(kakaoId);

        if (userId.isEmpty()) {
            return List.of();
        }

        return jdbc.query(
                """
                SELECT id, account_number, name, balance, status
                FROM accounts
                WHERE user_id = ?
                ORDER BY id
                """,
                this::mapAccount,
                userId.get()
        );
    }

    @Transactional(readOnly = true)
    public AccountResponse getMyAccount(
            long kakaoId,
            long accountId
    ) {
        requireOwnedAccountId(kakaoId, accountId);

        return findAccount(accountId)
                .orElseThrow(() -> fail(
                        HttpStatus.NOT_FOUND,
                        "Account not found"
                ));
    }

    private LockedAccount mapLockedAccount(
            ResultSet rs,
            int rowNum
    ) throws SQLException {
        return new LockedAccount(
                rs.getLong("id"),
                rs.getLong("user_id"),
                rs.getLong("balance"),
                rs.getString("status")
        );
    }

    private List<LockedAccount> lockAccounts(
            long fromId,
            long toId
    ) {
        long firstId = Math.min(fromId, toId);
        long secondId = Math.max(fromId, toId);

        return jdbc.query(
                """
                SELECT id, user_id, balance, status
                FROM accounts
                WHERE id IN (?, ?)
                ORDER BY id
                FOR UPDATE
                """,
                this::mapLockedAccount,
                firstId,
                secondId
        );
    }

    private Optional<StoredTransfer> findTransfer(
            String idempotencyKey
    ) {
        return jdbc.query(
                """
                SELECT
                    id,
                    from_account_id,
                    to_account_id,
                    amount,
                    memo,
                    status
                FROM transfers
                WHERE idempotency_key = ?
                """,
                (rs, rowNum) -> new StoredTransfer(
                        rs.getLong("id"),
                        rs.getLong("from_account_id"),
                        rs.getLong("to_account_id"),
                        rs.getLong("amount"),
                        rs.getString("memo"),
                        rs.getString("status")
                ),
                idempotencyKey
        ).stream().findFirst();
    }

    private TransferResponse replayTransfer(
            StoredTransfer existing,
            TransferRequest request,
            String idempotencyKey
    ) {
        String requestedMemo = request.memo() == null
                ? null
                : request.memo().trim();

        if (
                existing.fromAccountId() != request.fromAccountId()
                || existing.toAccountId() != request.toAccountId()
                || existing.amount() != request.amount()
                || !java.util.Objects.equals(
                        existing.memo(),
                        requestedMemo
                )
        ) {
            throw fail(
                    HttpStatus.CONFLICT,
                    "Idempotency key belongs to another request"
            );
        }

        if (!"COMPLETED".equals(existing.status())) {
            throw fail(
                    HttpStatus.CONFLICT,
                    "Transfer is not completed"
            );
        }

        return new TransferResponse(
                existing.id(),
                existing.fromAccountId(),
                existing.toAccountId(),
                existing.amount(),
                existing.status(),
                idempotencyKey,
                true
        );
    }

    @Transactional
    public TransferResponse transfer(
            long kakaoId,
            TransferRequest request,
            String idempotencyKey
    ) {
        if (request.fromAccountId().equals(request.toAccountId())) {
            throw fail(
                    HttpStatus.BAD_REQUEST,
                    "Source and destination must differ"
            );
        }

        if (request.amount() <= 0) {
            throw fail(
                    HttpStatus.BAD_REQUEST,
                    "Transfer amount must be positive"
            );
        }

        long senderUserId = findMyBankingUser(kakaoId)
                .orElseThrow(() -> fail(
                        HttpStatus.NOT_FOUND,
                        "Sender account not found"
                ));

        List<LockedAccount> accounts = lockAccounts(
                request.fromAccountId(),
                request.toAccountId()
        );

        if (accounts.size() != 2) {
            throw fail(
                    HttpStatus.NOT_FOUND,
                    "Transfer account not found"
            );
        }

        LockedAccount from = accounts.stream()
                .filter(a -> a.id() == request.fromAccountId())
                .findFirst()
                .orElseThrow();

        LockedAccount to = accounts.stream()
                .filter(a -> a.id() == request.toAccountId())
                .findFirst()
                .orElseThrow();

        if (from.userId() != senderUserId) {
            throw fail(
                    HttpStatus.NOT_FOUND,
                    "Sender account not found"
            );
        }

        if (
                !"ACTIVE".equals(from.status())
                || !"ACTIVE".equals(to.status())
        ) {
            throw fail(
                    HttpStatus.CONFLICT,
                    "Inactive account"
            );
        }

        Optional<StoredTransfer> existing =
                findTransfer(idempotencyKey);

        if (existing.isPresent()) {
            return replayTransfer(
                    existing.get(),
                    request,
                    idempotencyKey
            );
        }

        if (from.balance() < request.amount()) {
            throw fail(
                    HttpStatus.CONFLICT,
                    "Insufficient balance"
            );
        }

        if (to.balance() > Long.MAX_VALUE - request.amount()) {
            throw fail(
                    HttpStatus.CONFLICT,
                    "Destination balance overflow"
            );
        }

        String memo = request.memo() == null
                ? null
                : request.memo().trim();

        List<Long> insertedIds = jdbc.queryForList(
                """
                INSERT INTO transfers (
                    from_account_id,
                    to_account_id,
                    amount,
                    status,
                    idempotency_key,
                    memo
                )
                VALUES (?, ?, ?, 'PENDING', ?, ?)
                ON CONFLICT (idempotency_key) DO NOTHING
                RETURNING id
                """,
                Long.class,
                from.id(),
                to.id(),
                request.amount(),
                idempotencyKey,
                memo
        );

        if (insertedIds.isEmpty()) {
            StoredTransfer duplicate = findTransfer(idempotencyKey)
                    .orElseThrow(() -> fail(
                            HttpStatus.CONFLICT,
                            "Concurrent transfer conflict"
                    ));

            return replayTransfer(
                    duplicate,
                    request,
                    idempotencyKey
            );
        }

        long transferId = insertedIds.getFirst();

        int debited = jdbc.update(
                """
                UPDATE accounts
                SET balance = balance - ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                  AND balance >= ?
                """,
                request.amount(),
                from.id(),
                request.amount()
        );

        int credited = jdbc.update(
                """
                UPDATE accounts
                SET balance = balance + ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                request.amount(),
                to.id()
        );

        if (debited != 1 || credited != 1) {
            throw fail(
                    HttpStatus.CONFLICT,
                    "Account balance update failed"
            );
        }

        long senderBalanceAfter =
                from.balance() - request.amount();

        long receiverBalanceAfter =
                to.balance() + request.amount();

        jdbc.update(
                """
                INSERT INTO transactions (
                    account_id,
                    transfer_id,
                    type,
                    amount,
                    balance_after,
                    description
                )
                VALUES (?, ?, 'WITHDRAWAL', ?, ?, ?)
                """,
                from.id(),
                transferId,
                request.amount(),
                senderBalanceAfter,
                memo
        );

        jdbc.update(
                """
                INSERT INTO transactions (
                    account_id,
                    transfer_id,
                    type,
                    amount,
                    balance_after,
                    description
                )
                VALUES (?, ?, 'DEPOSIT', ?, ?, ?)
                """,
                to.id(),
                transferId,
                request.amount(),
                receiverBalanceAfter,
                memo
        );

        jdbc.update(
                """
                UPDATE transfers
                SET status = 'COMPLETED',
                    completed_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                transferId
        );

        return new TransferResponse(
                transferId,
                from.id(),
                to.id(),
                request.amount(),
                "COMPLETED",
                idempotencyKey,
                false
        );
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getTransactions(
            long kakaoId,
            long accountId
    ) {
        requireOwnedAccountId(kakaoId, accountId);

        return jdbc.query(
                """
                SELECT
                    id,
                    account_id,
                    transfer_id,
                    type,
                    amount,
                    balance_after,
                    description,
                    created_at
                FROM transactions
                WHERE account_id = ?
                ORDER BY created_at DESC, id DESC
                LIMIT 100
                """,
                (rs, rowNum) -> new TransactionResponse(
                        rs.getLong("id"),
                        rs.getLong("account_id"),
                        rs.getLong("transfer_id"),
                        rs.getString("type"),
                        rs.getLong("amount"),
                        rs.getLong("balance_after"),
                        rs.getString("description"),
                        rs.getTimestamp("created_at").toInstant()
                ),
                accountId
        );
    }

    @Transactional
    public DemoFundingResponse fundDemoAccount(
            long kakaoId,
            DemoFundingRequest request
    ) {
        long accountId = requireOwnedAccountId(
                kakaoId,
                request.accountId()
        );

        List<LockedAccount> accounts = jdbc.query(
                """
                SELECT id, user_id, balance, status
                FROM accounts
                WHERE id = ?
                FOR UPDATE
                """,
                this::mapLockedAccount,
                accountId
        );

        if (accounts.isEmpty()
                || !"ACTIVE".equals(accounts.getFirst().status())) {
            throw fail(
                    HttpStatus.CONFLICT,
                    "Account is not active"
            );
        }

        int updated = jdbc.update(
                """
                UPDATE accounts
                SET balance = balance + ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                  AND balance + ? <= 1000000
                """,
                request.amount(),
                accountId,
                request.amount()
        );

        if (updated != 1) {
            throw fail(
                    HttpStatus.CONFLICT,
                    "Demo funding limit exceeded"
            );
        }

        long balance = findAccount(accountId)
                .orElseThrow()
                .balance();

        jdbc.update(
                """
                INSERT INTO banking_demo_funding (
                    account_id,
                    amount,
                    balance_after
                )
                VALUES (?, ?, ?)
                """,
                accountId,
                request.amount(),
                balance
        );

        return new DemoFundingResponse(
                accountId,
                request.amount(),
                balance
        );
    }
}
