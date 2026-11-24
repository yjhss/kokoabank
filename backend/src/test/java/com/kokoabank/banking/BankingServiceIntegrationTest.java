package com.kokoabank.banking;

import com.kokoabank.banking.BankingDtos.AccountCreateRequest;
import com.kokoabank.banking.BankingDtos.AccountResponse;
import com.kokoabank.banking.BankingDtos.DemoFundingRequest;
import com.kokoabank.banking.BankingDtos.TransferRequest;
import com.kokoabank.banking.BankingDtos.TransferResponse;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.testcontainers.postgresql.PostgreSQLContainer;

import javax.sql.DataSource;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

class BankingServiceIntegrationTest {

    private static final PostgreSQLContainer postgres =
        new PostgreSQLContainer("postgres:17-alpine");

    private static JdbcTemplate jdbc;
    private static BankingService banking;
    private static TransactionTemplate tx;

    private static final long KAKAO_ID = 123456789L;

    @BeforeAll
    static void startDatabase() {
        postgres.start();

        DriverManagerDataSource dataSource =
                new DriverManagerDataSource(
                        postgres.getJdbcUrl(),
                        postgres.getUsername(),
                        postgres.getPassword()
                );

        Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .load()
                .migrate();

        jdbc = new JdbcTemplate(dataSource);
        banking = new BankingService(jdbc);

        tx = new TransactionTemplate(
                new DataSourceTransactionManager(dataSource)
        );
    }

    @AfterAll
    static void stopDatabase() {
        postgres.stop();
    }

    @BeforeEach
    void resetDatabase() {
        jdbc.execute(
                """
                TRUNCATE TABLE
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
                VALUES (?, 'ADMIN')
                """,
                KAKAO_ID
        );
    }

    private AccountResponse createAccount(String name) {
        return tx.execute(status ->
                banking.createAccount(
                        KAKAO_ID,
                        new AccountCreateRequest(name)
                )
        );
    }

    private void fund(long accountId, long amount) {
        tx.executeWithoutResult(status ->
                banking.fundDemoAccount(
                        KAKAO_ID,
                        new DemoFundingRequest(accountId, amount)
                )
        );
    }

    private TransferResponse transfer(
            long fromId,
            long toId,
            long amount,
            String key
    ) {
        return tx.execute(status ->
                banking.transfer(
                        KAKAO_ID,
                        new TransferRequest(
                                fromId,
                                toId,
                                amount,
                                "Integration test"
                        ),
                        key
                )
        );
    }

    @Test
    void createAccountAndReadIt() {
        AccountResponse created = createAccount("Test Account");

        assertNotNull(created);
        assertEquals(0, created.balance());
        assertEquals("ACTIVE", created.status());

        var accounts = banking.getMyAccounts(KAKAO_ID);

        assertEquals(1, accounts.size());
        assertEquals(created.id(), accounts.getFirst().id());
    }

    @Test
    void transferUpdatesBothBalancesAndLedger() {
        AccountResponse from = createAccount("Sender");
        AccountResponse to = createAccount("Receiver");

        fund(from.id(), 10000);

        TransferResponse result = transfer(
                from.id(),
                to.id(),
                3000,
                UUID.randomUUID().toString()
        );

        assertEquals("COMPLETED", result.status());

        assertEquals(
                7000,
                banking.getMyAccount(
                        KAKAO_ID, from.id()
                ).balance()
        );

        assertEquals(
                3000,
                banking.getMyAccount(
                        KAKAO_ID, to.id()
                ).balance()
        );

        assertEquals(
                1,
                banking.getTransactions(
                        KAKAO_ID, from.id()
                ).size()
        );

        assertEquals(
                1,
                banking.getTransactions(
                        KAKAO_ID, to.id()
                ).size()
        );
    }

    @Test
    void duplicateTransferIsAppliedOnlyOnce() {
        AccountResponse from = createAccount("Sender");
        AccountResponse to = createAccount("Receiver");

        fund(from.id(), 10000);

        String key = UUID.randomUUID().toString();

        TransferResponse first = transfer(
                from.id(), to.id(), 2500, key
        );

        TransferResponse second = transfer(
                from.id(), to.id(), 2500, key
        );

        assertEquals(first.id(), second.id());
        assertFalse(first.replayed());
        assertTrue(second.replayed());

        assertEquals(
                7500,
                banking.getMyAccount(
                        KAKAO_ID, from.id()
                ).balance()
        );

        assertEquals(
                2500,
                banking.getMyAccount(
                        KAKAO_ID, to.id()
                ).balance()
        );

        Long transferCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM transfers",
                Long.class
        );

        assertEquals(1L, transferCount);
    }

    @Test
    void insufficientBalanceRollsBackEverything() {
        AccountResponse from = createAccount("Sender");
        AccountResponse to = createAccount("Receiver");

        fund(from.id(), 1000);

        assertThrows(
                ResponseStatusException.class,
                () -> transfer(
                        from.id(),
                        to.id(),
                        2000,
                        UUID.randomUUID().toString()
                )
        );

        assertEquals(
                1000,
                banking.getMyAccount(
                        KAKAO_ID, from.id()
                ).balance()
        );

        assertEquals(
                0,
                banking.getMyAccount(
                        KAKAO_ID, to.id()
                ).balance()
        );

        Long count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM transfers",
                Long.class
        );

        assertEquals(0L, count);
    }

    @Test
    void concurrentTransfersNeverOverdrawBalance()
            throws Exception {

        AccountResponse from = createAccount("Sender");
        AccountResponse to = createAccount("Receiver");

        fund(from.id(), 10000);

        ExecutorService executor =
                Executors.newFixedThreadPool(10);

        try {
            List<Callable<Boolean>> tasks = new ArrayList<>();

            for (int i = 0; i < 20; i++) {
                tasks.add(() -> {
                    try {
                        transfer(
                                from.id(),
                                to.id(),
                                1000,
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

            List<Future<Boolean>> results =
                    executor.invokeAll(tasks);

            int successes = 0;

            for (Future<Boolean> result : results) {
                if (result.get()) {
                    successes++;
                }
            }

            assertEquals(10, successes);

            long senderBalance = banking.getMyAccount(
                    KAKAO_ID, from.id()
            ).balance();

            long receiverBalance = banking.getMyAccount(
                    KAKAO_ID, to.id()
            ).balance();

            assertEquals(0, senderBalance);
            assertEquals(10000, receiverBalance);
            assertEquals(
                    10000,
                    senderBalance + receiverBalance
            );

        } finally {
            executor.shutdownNow();
        }
    }
}
