package com.kokoabank.reward;

import com.kokoabank.reward.RewardDtos.CardPaymentRequest;
import com.kokoabank.reward.RewardDtos.CardPaymentResponse;
import com.kokoabank.reward.RewardDtos.RewardDrawResponse;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import org.testcontainers.postgresql.PostgreSQLContainer;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

class RewardServiceIntegrationTest {

    private static final PostgreSQLContainer postgres =
            new PostgreSQLContainer("postgres:17-alpine");

    private static HikariDataSource dataSource;
    private static JdbcTemplate jdbc;
    private static TransactionTemplate tx;
    private static RewardService reward;

    private static final long KAKAO_ID = 123456789L;
    private static final long OTHER_KAKAO_ID = 987654321L;

    @BeforeAll
    static void startDatabase() {
        postgres.start();

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(postgres.getJdbcUrl());
        config.setUsername(postgres.getUsername());
        config.setPassword(postgres.getPassword());
        config.setMaximumPoolSize(12);

        dataSource = new HikariDataSource(config);

        Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .load()
                .migrate();

        jdbc = new JdbcTemplate(dataSource);

        tx = new TransactionTemplate(
                new DataSourceTransactionManager(dataSource)
        );

        reward = new RewardService(jdbc);
    }

    @AfterAll
    static void stopDatabase() {
        if (dataSource != null) {
            dataSource.close();
        }

        postgres.stop();
    }

    @BeforeEach
    void resetDatabase() {
        jdbc.execute(
                """
                TRUNCATE TABLE
                    card_payment_ledger,
                    card_payments,
                    reward_draws,
                    banking_demo_funding,
                    transactions,
                    transfers,
                    accounts,
                    banking_user_links,
                    users,
                    platform_users
                RESTART IDENTITY CASCADE
                """
        );

        jdbc.update(
                """
                INSERT INTO platform_users (kakao_id, role)
                VALUES (?, 'USER'), (?, 'USER')
                """,
                KAKAO_ID,
                OTHER_KAKAO_ID
        );

        jdbc.update(
                """
                INSERT INTO users (username, password_hash, name)
                VALUES
                    ('reward-test-1', '!OAUTH_LOGIN_ONLY!', 'Test User 1'),
                    ('reward-test-2', '!OAUTH_LOGIN_ONLY!', 'Test User 2')
                """
        );

        jdbc.update(
                """
                INSERT INTO banking_user_links (
                    platform_user_id,
                    banking_user_id
                )
                SELECT p.id, u.id
                FROM platform_users p
                JOIN users u
                    ON (
                        p.kakao_id = ?
                        AND u.username = 'reward-test-1'
                    )
                    OR (
                        p.kakao_id = ?
                        AND u.username = 'reward-test-2'
                    )
                """,
                KAKAO_ID,
                OTHER_KAKAO_ID
        );

        jdbc.update(
                """
                INSERT INTO accounts (
                    user_id,
                    account_number,
                    name,
                    balance,
                    status
                )
                SELECT id, '77700000000000000001',
                       'Main Test Account', 50000, 'ACTIVE'
                FROM users
                WHERE username = 'reward-test-1'
                """
        );

        jdbc.update(
                """
                INSERT INTO accounts (
                    user_id,
                    account_number,
                    name,
                    balance,
                    status
                )
                SELECT id, '77700000000000000002',
                       'Other User Account', 50000, 'ACTIVE'
                FROM users
                WHERE username = 'reward-test-2'
                """
        );
    }

    private long accountId(String username) {
        return jdbc.queryForObject(
                """
                SELECT a.id
                FROM accounts a
                JOIN users u ON u.id = a.user_id
                WHERE u.username = ?
                """,
                Long.class,
                username
        );
    }

    private RewardDrawResponse draw(long kakaoId) {
        return tx.execute(status -> reward.draw(kakaoId));
    }

    private CardPaymentResponse pay(
            long kakaoId,
            CardPaymentRequest request,
            String key
    ) {
        return tx.execute(status ->
                reward.pay(kakaoId, request, key)
        );
    }

    private CardPaymentRequest request(
            long accountId,
            long drawId,
            long amount
    ) {
        return new CardPaymentRequest(
                accountId,
                drawId,
                amount,
                "Test Store"
        );
    }

    private long balance(long accountId) {
        return jdbc.queryForObject(
                "SELECT balance FROM accounts WHERE id = ?",
                Long.class,
                accountId
        );
    }

    private long count(String table) {
        return switch (table) {
            case "reward_draws" -> jdbc.queryForObject(
                    "SELECT COUNT(*) FROM reward_draws",
                    Long.class
            );
            case "card_payments" -> jdbc.queryForObject(
                    "SELECT COUNT(*) FROM card_payments",
                    Long.class
            );
            case "card_payment_ledger" -> jdbc.queryForObject(
                    "SELECT COUNT(*) FROM card_payment_ledger",
                    Long.class
            );
            default -> throw new IllegalArgumentException(table);
        };
    }

    @Test
    void drawReturnsOneAvailableReward() {
        RewardDrawResponse first = draw(KAKAO_ID);
        RewardDrawResponse second = draw(KAKAO_ID);

        assertEquals(first.id(), second.id());
        assertEquals("AVAILABLE", first.status());
        assertTrue(
                List.of(1, 2, 3, 5).contains(first.cashbackRate())
        );
        assertEquals(1L, count("reward_draws"));
    }

    @Test
    void paymentUpdatesBalanceAndLedger() {
        long accountId = accountId("reward-test-1");
        RewardDrawResponse draw = draw(KAKAO_ID);

        CardPaymentResponse result = pay(
                KAKAO_ID,
                request(accountId, draw.id(), 10000),
                UUID.randomUUID().toString()
        );

        long expectedCashback = 10000L * draw.cashbackRate() / 100;
        long expectedBalance = 50000L - 10000L + expectedCashback;

        assertEquals("COMPLETED", result.status());
        assertEquals(expectedCashback, result.cashbackAmount());
        assertEquals(expectedBalance, balance(accountId));
        assertEquals(1L, count("card_payments"));
        assertEquals(2L, count("card_payment_ledger"));

        var entries = reward.ledger(KAKAO_ID, accountId);

        assertEquals(2, entries.size());
        assertEquals(
                1,
                entries.stream()
                        .filter(e -> "PAYMENT".equals(e.entryType()))
                        .count()
        );
        assertEquals(
                1,
                entries.stream()
                        .filter(e -> "CASHBACK".equals(e.entryType()))
                        .count()
        );

        assertTrue(reward.getAvailableDraw(KAKAO_ID).isEmpty());
    }

    @Test
    void sameIdempotencyKeyDoesNotChargeTwice() {
        long accountId = accountId("reward-test-1");
        RewardDrawResponse draw = draw(KAKAO_ID);

        CardPaymentRequest request =
                request(accountId, draw.id(), 10000);

        String key = UUID.randomUUID().toString();

        CardPaymentResponse first = pay(
                KAKAO_ID, request, key
        );

        CardPaymentResponse second = pay(
                KAKAO_ID, request, key
        );

        assertEquals(first.id(), second.id());
        assertFalse(first.replayed());
        assertTrue(second.replayed());
        assertEquals(first.balanceAfter(), balance(accountId));
        assertEquals(1L, count("card_payments"));
        assertEquals(2L, count("card_payment_ledger"));
    }

    @Test
    void insufficientBalanceRollsBackAllChanges() {
        long accountId = accountId("reward-test-1");

        jdbc.update(
                "UPDATE accounts SET balance = 500 WHERE id = ?",
                accountId
        );

        RewardDrawResponse draw = draw(KAKAO_ID);

        assertThrows(
                ResponseStatusException.class,
                () -> pay(
                        KAKAO_ID,
                        request(accountId, draw.id(), 10000),
                        UUID.randomUUID().toString()
                )
        );

        assertEquals(500, balance(accountId));
        assertEquals(0L, count("card_payments"));
        assertEquals(0L, count("card_payment_ledger"));
        assertTrue(reward.getAvailableDraw(KAKAO_ID).isPresent());
    }

    @Test
    void otherUserAccountCannotBeCharged() {
        long otherAccountId = accountId("reward-test-2");
        RewardDrawResponse draw = draw(KAKAO_ID);

        assertThrows(
                ResponseStatusException.class,
                () -> pay(
                        KAKAO_ID,
                        request(otherAccountId, draw.id(), 10000),
                        UUID.randomUUID().toString()
                )
        );

        assertEquals(50000, balance(otherAccountId));
        assertEquals(0L, count("card_payments"));
    }

    @Test
    void concurrentPaymentsConsumeRewardOnce()
            throws Exception {

        long accountId = accountId("reward-test-1");
        RewardDrawResponse draw = draw(KAKAO_ID);

        ExecutorService executor =
                Executors.newFixedThreadPool(8);

        try {
            List<Callable<Boolean>> tasks = new ArrayList<>();

            for (int i = 0; i < 12; i++) {
                tasks.add(() -> {
                    try {
                        pay(
                                KAKAO_ID,
                                request(accountId, draw.id(), 10000),
                                UUID.randomUUID().toString()
                        );
                        return true;
                    } catch (ResponseStatusException exception) {
                        if (exception.getStatusCode().value() == 409) {
                            return false;
                        }

                        throw exception;
                    }
                });
            }

            List<Future<Boolean>> futures =
                    executor.invokeAll(tasks);

            int successes = 0;

            for (Future<Boolean> future : futures) {
                if (future.get()) {
                    successes++;
                }
            }

            assertEquals(1, successes);
            assertEquals(1L, count("card_payments"));
            assertEquals(2L, count("card_payment_ledger"));

            long expectedCashback =
                    10000L * draw.cashbackRate() / 100;

            assertEquals(
                    50000 - 10000 + expectedCashback,
                    balance(accountId)
            );
        } finally {
            executor.shutdownNow();
        }
    }
}
