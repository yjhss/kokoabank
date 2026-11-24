# Local Development Environment — Docker Compose 기반 개발환경

## 1. 도입 배경

개발자별 PostgreSQL·Redis 설치 및 설정 차이를 줄이고, 동일한 명령어로 개발환경을 재현하기 위해 Docker Compose를 도입하였다.

## 2. 기술 구성

| 기술 | 용도 |
|---|---|
| Docker Compose | 다중 컨테이너 실행 및 관리 |
| PostgreSQL 17 | 금융 데이터 저장 |
| Redis 7 | 캐시 및 보조 데이터 |
| Docker Network | 컨테이너 간 통신 |
| Docker Volume | 데이터 영속성 유지 |
| Health Check | 서비스 준비 상태 확인 |

## 3. 실행 방법

프로젝트 루트에서 `.env.example`을 복사하여 `.env`를 작성한다.

```bash
cp .env.example .env
docker compose up -d
docker compose ps
```

서비스 종료:

```bash
docker compose down
```

## 4. 설계 및 구현 고려사항

- 서비스 버전을 명시하여 실행환경의 예측 가능성을 높였다.
- PostgreSQL과 Redis에 Named Volume을 적용하였다.
- Health Check로 컨테이너 실행 여부와 준비 상태를 확인한다.
- DB 포트는 localhost에만 바인딩한다.
- 개발용 접속정보는 환경변수로 관리하고 Git에 포함하지 않는다.
- Redis는 로컬 전용으로 구성하며 운영환경에서 보안 설정을 별도로 적용한다.

## 5. 검증 방법

| 검증 대상 | 방법 | 결과 |
|---|---|---|
| PostgreSQL 실행 | docker compose ps | 검증 후 기록 |
| Redis 실행 | docker compose ps | 검증 후 기록 |
| PostgreSQL 접속 | psql | 검증 후 기록 |
| Redis 명령 | PING·SET·GET | 검증 후 기록 |
| 데이터 영속성 | 컨테이너 재생성 후 조회 | 검증 후 기록 |
| Spring Boot 연동 | 애플리케이션 실행 및 Testcontainers | 검증 후 기록 |

## 6. 운영환경 확장 계획

- PostgreSQL을 AWS RDS로 전환
- Redis를 AWS 관리형 Redis로 전환
- Kubernetes ConfigMap·Secret 및 Secrets Manager 적용
- 네트워크 접근 제어와 TLS 적용
- 백업 및 모니터링 구성

## 7. 참고 자료

- Docker Compose: https://docs.docker.com/compose/
- PostgreSQL: https://www.postgresql.org/docs/
- Redis: https://redis.io/docs/
- Spring Boot: https://docs.spring.io/spring-boot/