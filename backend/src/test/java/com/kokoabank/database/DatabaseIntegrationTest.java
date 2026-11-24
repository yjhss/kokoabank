package com.kokoabank.database;

import com.kokoabank.account.entity.Account;
import com.kokoabank.account.repository.AccountRepository;
import com.kokoabank.user.entity.User;
import com.kokoabank.user.repository.UserRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterEach;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;

import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers
class DatabaseIntegrationTest {

    @Container
    static PostgreSQLContainer postgres =
        new PostgreSQLContainer("postgres:17-alpine");

    @Container
    static GenericContainer<?> redis =
        new GenericContainer<>("redis:7-alpine")
            .withExposedPorts(6379);

    @DynamicPropertySource
    static void registerProperties(
        DynamicPropertyRegistry registry
    ) {
        registry.add(
            "spring.datasource.url",
            postgres::getJdbcUrl
        );
        registry.add(
            "spring.datasource.username",
            postgres::getUsername
        );
        registry.add(
            "spring.datasource.password",
            postgres::getPassword
        );

        registry.add(
            "spring.data.redis.host",
            redis::getHost
        );
        registry.add(
            "spring.data.redis.port",
            () -> redis.getMappedPort(6379)
        );
    }

    @Autowired
    JdbcTemplate jdbcTemplate;

    @Autowired
    UserRepository userRepository;

    @Autowired
    AccountRepository accountRepository;

    @Autowired
    StringRedisTemplate redisTemplate;

    private String redisTestKey;

    @AfterEach
    void cleanup() {
        if (redisTestKey != null) {
            redisTemplate.delete(redisTestKey);
        }
    }

    @Test
    void flywayCreatesBankingTables() {
        Integer tableCount = jdbcTemplate.queryForObject(
            """
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name IN (
                'users',
                'accounts',
                'transfers',
                'transactions'
              )
            """,
            Integer.class
        );

        assertThat(tableCount).isEqualTo(4);
    }

    @Test
    @Transactional
    void userAndAccountCanBeSavedAndQueried() {
        String username = "test-" + UUID.randomUUID();

        User user = userRepository.save(
            new User(
                username,
                "test-only-placeholder-hash",
                "테스트 사용자"
            )
        );

        Account account = accountRepository.save(
            new Account(
                user,
                "3333" + System.nanoTime(),
                "테스트 통장"
            )
        );

        assertThat(
            userRepository.findByUsername(username)
        ).isPresent();

        assertThat(
            accountRepository.findByAccountNumber(
                account.getAccountNumber()
            )
        ).isPresent();

        assertThat(account.getBalance()).isZero();
    }

    @Test
    void redisCanStoreAndReadValues() {
        redisTestKey = "test:kokoa:" + UUID.randomUUID();

        redisTemplate.opsForValue().set(
            redisTestKey,
            "hello-redis"
        );

        String value = redisTemplate
            .opsForValue()
            .get(redisTestKey);

        assertThat(value).isEqualTo("hello-redis");
    }
}