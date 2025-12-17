# TIRO Admin 시스템 아키텍처

> **문서 버전**: v1.0
> **최종 업데이트**: 2025-12-17
> **목적**: TIRO 관리자 사이트의 전체 시스템 아키텍처 및 컴포넌트 관계 정의

---

## 1. 시스템 개요

TIRO Admin은 TIRO 서비스(AI 기반 웹소설 작성 도구)의 운영 및 관리를 위한 별도의 관리자 전용 웹 애플리케이션입니다.

### 1.1 핵심 특징
- **독립 배포**: TIRO 메인 서비스와 별도의 프로젝트로 독립 배포
- **DB 공유**: 기존 TIRO PostgreSQL 데이터베이스 공유 (읽기/쓰기)
- **화이트리스트 인증**: Google OAuth + 이메일 화이트리스트 기반 접근 제어
- **역할 기반 권한**: ADMIN / SUPER_ADMIN 역할 구분

---

## 2. 전체 아키텍처 다이어그램

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[웹 브라우저]
    end

    subgraph "CDN / Edge"
        Vercel[Vercel Edge Network]
    end

    subgraph "Application Layer"
        subgraph "Next.js App Router"
            Middleware[middleware.ts<br/>인증 미들웨어]

            subgraph "Routes"
                AuthRoutes["(auth)/*<br/>로그인 페이지"]
                AdminRoutes["(admin)/*<br/>관리자 페이지"]
            end

            subgraph "API Routes"
                AuthAPI["/api/auth/*<br/>NextAuth.js"]
                StatsAPI["/api/stats/*<br/>통계 API"]
                UsersAPI["/api/users/*<br/>사용자 API"]
                ProjectsAPI["/api/projects/*<br/>프로젝트 API"]
                AiAPI["/api/ai/*<br/>AI 설정 API"]
                TransactionsAPI["/api/transactions/*<br/>거래 API"]
                PromotionsAPI["/api/promotions/*<br/>프로모션 API"]
                JobsAPI["/api/jobs/*<br/>작업 API"]
                LogsAPI["/api/audit-logs/*<br/>로그 API"]
                SettingsAPI["/api/settings/*<br/>설정 API"]
                ReportsAPI["/api/reports/*<br/>리포트 API"]
            end
        end
    end

    subgraph "Data Layer"
        Prisma[Prisma ORM]
        PostgreSQL[(PostgreSQL<br/>TIRO DB)]
    end

    subgraph "External Services"
        GoogleOAuth[Google OAuth 2.0]
    end

    Browser --> Vercel
    Vercel --> Middleware
    Middleware --> AuthRoutes
    Middleware --> AdminRoutes
    Middleware --> AuthAPI

    AdminRoutes --> StatsAPI
    AdminRoutes --> UsersAPI
    AdminRoutes --> ProjectsAPI
    AdminRoutes --> AiAPI
    AdminRoutes --> TransactionsAPI
    AdminRoutes --> PromotionsAPI
    AdminRoutes --> JobsAPI
    AdminRoutes --> LogsAPI
    AdminRoutes --> SettingsAPI
    AdminRoutes --> ReportsAPI

    AuthAPI --> GoogleOAuth
    AuthAPI --> Prisma
    StatsAPI --> Prisma
    UsersAPI --> Prisma
    ProjectsAPI --> Prisma
    AiAPI --> Prisma
    TransactionsAPI --> Prisma
    PromotionsAPI --> Prisma
    JobsAPI --> Prisma
    LogsAPI --> Prisma
    SettingsAPI --> Prisma
    ReportsAPI --> Prisma

    Prisma --> PostgreSQL
```

---

## 3. 계층별 상세 구조

### 3.1 프레젠테이션 계층 (Presentation Layer)

```mermaid
graph LR
    subgraph "Pages"
        Dashboard[대시보드]
        Users[사용자 관리]
        Projects[프로젝트 관리]
        AI[AI 설정]
        Credits[크레딧 관리]
        Promotions[프로모션]
        Jobs[작업 모니터링]
        Logs[감사 로그]
        Settings[시스템 설정]
        Reports[사용자 리포트]
    end

    subgraph "Shared Components"
        Layouts[레이아웃 컴포넌트]
        UI[shadcn/ui 컴포넌트]
        Features[기능별 컴포넌트]
    end

    subgraph "State & Data"
        Hooks[커스텀 훅]
        APIClient[API 클라이언트]
    end

    Dashboard --> Layouts
    Users --> Layouts
    Projects --> Layouts
    AI --> Layouts
    Credits --> Layouts
    Promotions --> Layouts
    Jobs --> Layouts
    Logs --> Layouts
    Settings --> Layouts
    Reports --> Layouts

    Layouts --> UI
    Layouts --> Features
    Features --> Hooks
    Hooks --> APIClient
```

### 3.2 비즈니스 로직 계층 (Business Logic Layer)

```mermaid
graph TB
    subgraph "API Route Handlers"
        RouteHandlers[Route Handlers<br/>GET/POST/PATCH/DELETE]
    end

    subgraph "Services"
        AuthService[인증 서비스]
        UserService[사용자 서비스]
        ProjectService[프로젝트 서비스]
        CreditService[크레딧 서비스]
        LoggingService[로깅 서비스]
    end

    subgraph "Utilities"
        Validators[Zod 검증]
        Formatters[포맷팅 유틸]
        Logger[관리자 활동 로거]
    end

    RouteHandlers --> AuthService
    RouteHandlers --> UserService
    RouteHandlers --> ProjectService
    RouteHandlers --> CreditService
    RouteHandlers --> LoggingService

    RouteHandlers --> Validators
    RouteHandlers --> Formatters
    RouteHandlers --> Logger
```

### 3.3 데이터 접근 계층 (Data Access Layer)

```mermaid
graph TB
    subgraph "Prisma Client"
        PrismaInstance[Prisma Client Instance]
    end

    subgraph "Models - TIRO 공유"
        User[User]
        Project[Project]
        Episode[Episode]
        CreditTransaction[CreditTransaction]
        AsyncJob[AsyncJob]
        AiCreditRate[AiCreditRate]
        AiProviderConfig[AiProviderConfig]
        PromotionCode[PromotionCode]
        AuditLog[AuditLog]
        UserReport[UserReport]
    end

    subgraph "Models - Admin 전용"
        AdminWhitelist[AdminWhitelist]
        AdminActivityLog[AdminActivityLog]
        SystemSetting[SystemSetting]
    end

    PrismaInstance --> User
    PrismaInstance --> Project
    PrismaInstance --> Episode
    PrismaInstance --> CreditTransaction
    PrismaInstance --> AsyncJob
    PrismaInstance --> AiCreditRate
    PrismaInstance --> AiProviderConfig
    PrismaInstance --> PromotionCode
    PrismaInstance --> AuditLog
    PrismaInstance --> UserReport
    PrismaInstance --> AdminWhitelist
    PrismaInstance --> AdminActivityLog
    PrismaInstance --> SystemSetting
```

---

## 4. 인증 및 권한 플로우

```mermaid
sequenceDiagram
    participant U as 사용자
    participant M as Middleware
    participant NA as NextAuth
    participant DB as Database
    participant G as Google OAuth

    U->>M: 페이지 접근 요청
    M->>M: 세션 확인

    alt 세션 없음
        M->>U: /login으로 리다이렉트
        U->>NA: Google 로그인 시도
        NA->>G: OAuth 인증 요청
        G->>NA: 인증 결과 (이메일)
        NA->>DB: admin_whitelist 확인

        alt 화이트리스트 등록됨
            DB->>NA: 관리자 정보 반환
            NA->>NA: 세션 생성 (role 포함)
            NA->>U: /dashboard로 리다이렉트
        else 미등록
            NA->>U: 접근 거부 에러
        end
    else 세션 있음
        M->>M: role 기반 권한 확인

        alt 권한 있음
            M->>U: 요청 페이지 반환
        else 권한 없음
            M->>U: 403 Forbidden
        end
    end
```

---

## 5. 디렉토리 구조

```
tiro-admin/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # 인증 관련 페이지 (로그인)
│   │   │   ├── login/
│   │   │   └── layout.tsx
│   │   ├── (admin)/                  # 관리자 페이지 (보호됨)
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── projects/
│   │   │   ├── ai/
│   │   │   ├── credits/
│   │   │   ├── promotions/
│   │   │   ├── jobs/
│   │   │   ├── audit-logs/
│   │   │   ├── settings/
│   │   │   ├── reports/
│   │   │   └── layout.tsx
│   │   ├── api/                      # API Route Handlers
│   │   │   ├── auth/[...nextauth]/
│   │   │   ├── stats/
│   │   │   ├── users/
│   │   │   ├── projects/
│   │   │   ├── ai/
│   │   │   ├── transactions/
│   │   │   ├── promotions/
│   │   │   ├── jobs/
│   │   │   ├── audit-logs/
│   │   │   ├── settings/
│   │   │   └── reports/
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui 컴포넌트
│   │   ├── layouts/                  # 레이아웃 컴포넌트
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── features/                 # 기능별 컴포넌트
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── projects/
│   │   │   ├── ai/
│   │   │   ├── credits/
│   │   │   ├── promotions/
│   │   │   ├── jobs/
│   │   │   ├── logs/
│   │   │   ├── settings/
│   │   │   └── reports/
│   │   └── providers/                # Context Providers
│   │
│   ├── lib/
│   │   ├── auth/                     # 인증 관련
│   │   │   ├── config.ts             # NextAuth 설정
│   │   │   └── session.ts            # 세션 유틸리티
│   │   ├── db/
│   │   │   └── prisma.ts             # Prisma 클라이언트
│   │   ├── api/
│   │   │   ├── client.ts             # fetch 래퍼
│   │   │   └── response.ts           # API 응답 헬퍼
│   │   ├── utils/
│   │   │   ├── admin-logger.ts       # 관리자 활동 로깅
│   │   │   └── format.ts             # 포맷팅 유틸
│   │   ├── constants/                # 상수 정의
│   │   └── validators/               # Zod 스키마
│   │
│   ├── types/                        # TypeScript 타입 정의
│   │   ├── user.ts
│   │   ├── project.ts
│   │   ├── transaction.ts
│   │   ├── job.ts
│   │   ├── promotion.ts
│   │   └── admin.ts
│   │
│   └── hooks/                        # 커스텀 React 훅
│
├── prisma/
│   ├── schema.prisma                 # Prisma 스키마
│   └── migrations/
│
├── docs/                             # 문서
├── progress/                         # 진행 상황
├── middleware.ts                     # Next.js 미들웨어
└── ...설정 파일들
```

---

## 6. 데이터 흐름

### 6.1 읽기 작업 흐름

```mermaid
graph LR
    A[Client Component] --> B[API Client]
    B --> C[API Route Handler]
    C --> D[Prisma Query]
    D --> E[(PostgreSQL)]
    E --> D
    D --> C
    C --> B
    B --> A
```

### 6.2 쓰기 작업 흐름 (활동 로깅 포함)

```mermaid
graph TB
    A[Client Component] --> B[API Client]
    B --> C[API Route Handler]
    C --> D{검증}

    D -->|실패| E[에러 응답]
    D -->|성공| F[Prisma Transaction]

    F --> G[데이터 변경]
    F --> H[AdminActivityLog 기록]

    G --> I[(PostgreSQL)]
    H --> I

    I --> J[성공 응답]
    J --> A
```

---

## 7. 주요 컴포넌트 관계

### 7.1 레이아웃 구조

```mermaid
graph TB
    RootLayout[Root Layout] --> AuthProvider[AuthProvider]
    AuthProvider --> AdminLayout[Admin Layout]

    AdminLayout --> Header[Header]
    AdminLayout --> Sidebar[Sidebar]
    AdminLayout --> MainContent[Main Content]

    Header --> UserMenu[User Menu]
    Header --> LogoutBtn[Logout]

    Sidebar --> NavItems[Navigation Items]

    MainContent --> Page[Page Component]
```

### 7.2 페이지 컴포넌트 구조

```mermaid
graph TB
    Page[Page Component] --> PageHeader[Page Header]
    Page --> Filters[Filter Components]
    Page --> DataTable[Data Table]
    Page --> Modals[Modal Components]

    DataTable --> Pagination[Pagination]
    DataTable --> Actions[Row Actions]

    Modals --> CreateModal[Create Modal]
    Modals --> EditModal[Edit Modal]
    Modals --> DeleteConfirm[Delete Confirm]
```

---

## 8. 외부 시스템 연동

### 8.1 현재 연동

| 시스템 | 용도 | 연동 방식 |
|--------|------|----------|
| Google OAuth 2.0 | 관리자 인증 | NextAuth.js |
| PostgreSQL (TIRO DB) | 데이터 저장소 | Prisma ORM |
| Vercel | 호스팅/배포 | Git 연동 |

### 8.2 향후 연동 가능

| 시스템 | 용도 |
|--------|------|
| Slack/Discord | 알림 연동 |
| Email Service | 관리자 알림 |
| Analytics | 사용 통계 |

---

## 9. 보안 아키텍처

### 9.1 인증/인가

- **인증**: Google OAuth 2.0 + NextAuth.js
- **인가**: 역할 기반 접근 제어 (RBAC)
  - `ADMIN`: 일반 관리 기능
  - `SUPER_ADMIN`: 관리자 관리, 시스템 설정

### 9.2 보안 레이어

```mermaid
graph TB
    A[요청] --> B[Edge Middleware]
    B --> C[세션 검증]
    C --> D[역할 확인]
    D --> E[API 핸들러]
    E --> F[입력 검증 - Zod]
    F --> G[비즈니스 로직]
    G --> H[활동 로깅]
```

### 9.3 감사 로깅

모든 관리자 활동은 `admin_activity_logs` 테이블에 기록:
- 수행자 이메일
- 수행 액션
- 대상 타입/ID
- 변경 전/후 데이터 (JSON)
- IP 주소, User Agent
- 타임스탬프

---

## 10. 성능 고려사항

### 10.1 서버 사이드

- Prisma Connection Pool 관리
- 쿼리 최적화 (select, include 명시)
- 페이지네이션 적용

### 10.2 클라이언트 사이드

- React Server Components 활용
- 동적 import로 코드 스플리팅
- SWR/React Query 캐싱 (필요시)

---

## 11. 아키텍처 제약조건

### 11.1 필수 준수 사항

1. **데이터베이스 공유**: TIRO 메인 서비스와 동일한 DB 사용
2. **화이트리스트 인증**: 반드시 admin_whitelist 테이블 기반 인증
3. **활동 로깅**: 데이터 변경 시 반드시 AdminActivityLog 기록
4. **API 응답 형식**: 일관된 JSON 응답 구조 사용

### 11.2 금지 사항

1. TIRO 메인 서비스의 핵심 비즈니스 로직 중복 구현 금지
2. 사용자 비밀번호 직접 접근/수정 금지
3. 하드코딩된 인증 정보 금지

---

*이 문서는 시스템 변경 시 반드시 업데이트되어야 합니다.*
