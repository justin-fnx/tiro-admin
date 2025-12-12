# TIRO 관리자 사이트 구축 계획서

> **프로젝트명**: tiro-admin
> **작성일**: 2025-12-12
> **목적**: TIRO 서비스의 운영 및 관리를 위한 별도의 관리자 전용 웹 애플리케이션 구축

---

## 1. 프로젝트 개요

### 1.1 목적
TIRO 서비스(AI 기반 웹소설 작성 도구)의 운영 및 관리를 위한 별도의 관리자 전용 웹 애플리케이션 구축

### 1.2 핵심 요구사항
| 항목 | 설명 |
|------|------|
| **인증** | Google OAuth 2.0 로그인만 허용 |
| **접근 제어** | 미리 설정된 Google 이메일 주소만 접근 가능 (화이트리스트 방식) |
| **배포** | 별도 프로젝트로 독립 배포 |
| **DB** | 기존 TIRO DB 공유 (읽기/쓰기) |

### 1.3 기술 스택

| 구분 | 기술 |
|------|------|
| **프레임워크** | Next.js 14+ (App Router) |
| **언어** | TypeScript 5+ |
| **UI 라이브러리** | React 18+ |
| **스타일링** | TailwindCSS, shadcn/ui |
| **인증** | NextAuth.js (Google Provider) |
| **ORM** | Prisma 5+ |
| **DB** | PostgreSQL 15+ (기존 TIRO DB) |
| **차트** | Recharts |
| **폼 검증** | React Hook Form + Zod |
| **배포** | Vercel |

---

## 2. 전체 기능 목록

### 2.1 대시보드
- 실시간 통계 (총 사용자, 활성 프로젝트, 오늘 가입자, AI 사용량)
- 최근 7일 사용 추이 그래프
- 시스템 상태 모니터링 (비동기 작업 대기열, 오류율)
- 최근 가입 사용자 목록
- 대기 중인 작업 목록

### 2.2 사용자 관리
- 사용자 목록 조회 (검색, 필터, 정렬, 페이지네이션)
- 사용자 상세 정보 조회/수정
- 구독 플랜 변경
- 크레딧 수동 조정 (지급/차감)
- 사용자 비활성화/삭제
- 이메일 인증 상태 관리
- 사용자별 프로젝트/거래 내역 조회

### 2.3 프로젝트 관리
- 프로젝트 목록 조회 (검색, 필터)
- 프로젝트 상세 정보 조회
- 프로젝트 상태 변경 (강제 삭제/아카이브)
- 프로젝트별 통계 (회차 수, 토큰 사용량)
- 회차 목록 조회

### 2.4 AI 설정 관리

#### 2.4.1 크레딧 비율 관리 (ai_credit_rates)
- 프로바이더/모델별 입력/출력 크레딧 비율 조회
- 비율 수정
- 새 모델 추가
- 모델 비활성화

#### 2.4.2 프로바이더 설정 관리 (ai_provider_configs)
- 기능별 사용 프로바이더/모델 설정 조회
- 설정 변경
- 기능별 활성화/비활성화

### 2.5 크레딧/거래 관리
- 토큰 거래 내역 전체 조회
- 거래 유형별 필터링 (PURCHASE, USAGE, BONUS, REFUND 등)
- 날짜 범위 필터
- 엑셀 내보내기

### 2.6 프로모션 코드 관리
- 프로모션 코드 목록 조회
- 새 프로모션 코드 생성
  - 코드 타입 (PUBLIC/PRIVATE)
  - 크레딧 금액
  - 쿼터 (사용 가능 횟수)
  - 만료일
- 코드 수정/비활성화/삭제
- 사용 이력 조회

### 2.7 작업 모니터링
- 비동기 작업(async_jobs) 현황 조회
- 상태별 필터링 (PENDING/PROCESSING/COMPLETED/FAILED/CANCELLED)
- 실패한 작업 재시도
- 작업 취소
- 작업 상세 로그 조회
- 자동 새로고침

### 2.8 감사 로그
- 시스템 감사 로그 조회 (audit_logs)
- 관리자 활동 로그 조회 (admin_activity_logs)
- 액션별/사용자별 필터링
- 날짜 범위 필터
- 로그 상세 조회

### 2.9 관리자 설정
- 화이트리스트 관리 (허용된 관리자 이메일 목록)
- 관리자 역할 관리 (ADMIN/SUPER_ADMIN)
- 시스템 설정 관리 (기본값, 한도 등)

---

## 3. 데이터베이스 스키마

### 3.1 기존 TIRO DB 테이블 (읽기/쓰기)

관리자 사이트에서 사용하는 기존 테이블:

| 테이블 | 용도 | 권한 |
|--------|------|------|
| `users` | 사용자 관리 | 읽기/쓰기 |
| `projects` | 프로젝트 관리 | 읽기/쓰기 |
| `episodes` | 회차 조회 | 읽기 |
| `token_transactions` | 거래 내역 | 읽기/쓰기 |
| `ai_credit_rates` | 크레딧 비율 | 읽기/쓰기 |
| `ai_provider_configs` | AI 설정 | 읽기/쓰기 |
| `promotion_codes` | 프로모션 코드 | 읽기/쓰기 |
| `promotion_code_usages` | 사용 이력 | 읽기 |
| `async_jobs` | 작업 모니터링 | 읽기/쓰기 |
| `audit_logs` | 감사 로그 | 읽기 |

### 3.2 관리자 전용 테이블 (신규 추가)

```sql
-- ============================================
-- 관리자 시스템 테이블
-- ============================================

-- 관리자 화이트리스트
CREATE TABLE admin_whitelist (
    id VARCHAR(30) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'ADMIN', -- ADMIN, SUPER_ADMIN
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(30), -- 생성한 관리자 ID
    last_login_at TIMESTAMP
);

CREATE INDEX idx_admin_whitelist_email ON admin_whitelist(email);
CREATE INDEX idx_admin_whitelist_is_active ON admin_whitelist(is_active);

-- 관리자 활동 로그
CREATE TABLE admin_activity_logs (
    id VARCHAR(30) PRIMARY KEY,
    admin_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL, -- 'user.credit_adjust', 'user.plan_change' 등
    target_type VARCHAR(50), -- 'user', 'project', 'promotion_code' 등
    target_id VARCHAR(30),
    details JSONB, -- 변경 전/후 데이터
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_activity_admin_email ON admin_activity_logs(admin_email);
CREATE INDEX idx_admin_activity_action ON admin_activity_logs(action);
CREATE INDEX idx_admin_activity_target ON admin_activity_logs(target_type, target_id);
CREATE INDEX idx_admin_activity_created ON admin_activity_logs(created_at DESC);

-- 시스템 설정 (key-value)
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255) -- 관리자 이메일
);

-- 자동 updated_at 갱신 트리거
CREATE TRIGGER update_admin_whitelist_updated_at
    BEFORE UPDATE ON admin_whitelist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 테이블 코멘트
COMMENT ON TABLE admin_whitelist IS '관리자 이메일 화이트리스트';
COMMENT ON TABLE admin_activity_logs IS '관리자 활동 로그';
COMMENT ON TABLE system_settings IS '시스템 설정 (key-value)';
```

### 3.3 Prisma Schema 추가

```prisma
// 관리자 역할 enum
enum AdminRole {
  ADMIN
  SUPER_ADMIN
}

// 관리자 화이트리스트
model AdminWhitelist {
  id          String    @id @default(cuid())
  email       String    @unique
  name        String?
  role        AdminRole @default(ADMIN)
  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  createdBy   String?   @map("created_by")
  lastLoginAt DateTime? @map("last_login_at")

  @@index([email])
  @@index([isActive])
  @@map("admin_whitelist")
}

// 관리자 활동 로그
model AdminActivityLog {
  id         String   @id @default(cuid())
  adminEmail String   @map("admin_email")
  action     String
  targetType String?  @map("target_type")
  targetId   String?  @map("target_id")
  details    Json?
  ipAddress  String?  @map("ip_address")
  userAgent  String?  @map("user_agent")
  createdAt  DateTime @default(now()) @map("created_at")

  @@index([adminEmail])
  @@index([action])
  @@index([targetType, targetId])
  @@index([createdAt(sort: Desc)])
  @@map("admin_activity_logs")
}

// 시스템 설정
model SystemSetting {
  key         String   @id
  value       Json
  description String?
  updatedAt   DateTime @updatedAt @map("updated_at")
  updatedBy   String?  @map("updated_by")

  @@map("system_settings")
}
```

---

## 4. 화면 구성

### 4.1 레이아웃 구조

```
┌─────────────────────────────────────────────────────────────────┐
│ Header                                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Logo (TIRO Admin)  │  Search  │  Admin Name  │  Logout     │ │
│ └─────────────────────────────────────────────────────────────┘ │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                  │
│  Sidebar     │              Main Content Area                   │
│              │                                                  │
│  ┌────────┐  │  ┌──────────────────────────────────────────┐   │
│  │ 대시보드 │  │  │                                          │   │
│  ├────────┤  │  │     Page Content                         │   │
│  │사용자관리│  │  │                                          │   │
│  ├────────┤  │  │                                          │   │
│  │프로젝트 │  │  │                                          │   │
│  ├────────┤  │  │                                          │   │
│  │ AI 설정 │  │  │                                          │   │
│  ├────────┤  │  │                                          │   │
│  │크레딧관리│  │  │                                          │   │
│  ├────────┤  │  │                                          │   │
│  │프로모션 │  │  │                                          │   │
│  ├────────┤  │  │                                          │   │
│  │작업모니터│  │  │                                          │   │
│  ├────────┤  │  │                                          │   │
│  │감사로그 │  │  │                                          │   │
│  ├────────┤  │  │                                          │   │
│  │  설정   │  │  │                                          │   │
│  └────────┘  │  └──────────────────────────────────────────┘   │
│              │                                                  │
└──────────────┴──────────────────────────────────────────────────┘
```

### 4.2 페이지 라우트 구조

| 경로 | 화면명 | 설명 | 권한 |
|------|--------|------|------|
| `/` | 로그인 | Google 로그인 버튼 | - |
| `/dashboard` | 대시보드 | 통계, 그래프, 시스템 상태 | ADMIN |
| `/users` | 사용자 목록 | 검색, 필터, 페이지네이션 | ADMIN |
| `/users/[id]` | 사용자 상세 | 프로필, 크레딧, 프로젝트, 활동 | ADMIN |
| `/projects` | 프로젝트 목록 | 전체 프로젝트 조회 | ADMIN |
| `/projects/[id]` | 프로젝트 상세 | 프로젝트 정보, 회차 목록 | ADMIN |
| `/ai/credit-rates` | 크레딧 비율 | 모델별 비율 관리 | ADMIN |
| `/ai/providers` | 프로바이더 설정 | 기능별 AI 설정 | ADMIN |
| `/credits` | 거래 내역 | 전체 크레딧 거래 | ADMIN |
| `/promotions` | 프로모션 코드 | 코드 목록, 생성, 수정 | ADMIN |
| `/jobs` | 작업 모니터링 | 비동기 작업 현황 | ADMIN |
| `/audit-logs` | 감사 로그 | 시스템 로그 조회 | ADMIN |
| `/settings/admins` | 관리자 관리 | 화이트리스트 관리 | SUPER_ADMIN |
| `/settings/system` | 시스템 설정 | 시스템 변수 관리 | SUPER_ADMIN |

### 4.3 주요 화면 상세

#### 4.3.1 대시보드
- **통계 카드** (4개)
  - 총 사용자 수 (전일 대비 증감)
  - 활성 프로젝트 수
  - 오늘 가입자 수
  - 오늘 AI 사용량 (크레딧)
- **사용 추이 그래프** (라인 차트)
  - 7일간 일별 가입자 수
  - 7일간 일별 AI 사용량
- **최근 가입 사용자** (5명)
- **대기 중인 작업** (5개)

#### 4.3.2 사용자 상세 페이지
- **프로필 카드**: 이메일, 이름, 가입일, 마지막 로그인
- **크레딧 현황**: 일간/주간/충전 크레딧 + 조정 버튼
- **구독 정보**: 현재 플랜 + 변경 버튼
- **프로젝트 목록**: 사용자의 프로젝트 테이블
- **거래 내역**: 최근 거래 20건
- **활동 로그**: 최근 활동 20건

#### 4.3.3 AI 크레딧 비율 관리
- **프로바이더별 그룹** (Accordion)
  - Claude
  - OpenAI
  - DeepInfra
- **각 모델별 행**
  - 모델명, 입력 비율, 출력 비율, 활성화 상태
  - 인라인 편집 버튼
- **새 모델 추가** 버튼

---

## 5. API 엔드포인트 목록

### 5.1 인증 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/auth/[...nextauth]` | NextAuth.js 핸들러 |

### 5.2 통계 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/stats/overview` | 대시보드 통계 |
| GET | `/api/stats/usage` | 사용 추이 (7일) |
| GET | `/api/stats/jobs` | 작업 현황 통계 |

### 5.3 사용자 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/users` | 사용자 목록 |
| GET | `/api/users/[id]` | 사용자 상세 |
| PATCH | `/api/users/[id]` | 사용자 정보 수정 |
| DELETE | `/api/users/[id]` | 사용자 비활성화 |
| POST | `/api/users/[id]/credits` | 크레딧 조정 |
| POST | `/api/users/[id]/plan` | 플랜 변경 |
| GET | `/api/users/[id]/projects` | 사용자 프로젝트 |
| GET | `/api/users/[id]/transactions` | 사용자 거래 내역 |

### 5.4 프로젝트 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/projects` | 프로젝트 목록 |
| GET | `/api/projects/[id]` | 프로젝트 상세 |
| PATCH | `/api/projects/[id]` | 프로젝트 상태 변경 |
| DELETE | `/api/projects/[id]` | 프로젝트 삭제 |
| GET | `/api/projects/[id]/episodes` | 회차 목록 |

### 5.5 AI 설정 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/ai/credit-rates` | 크레딧 비율 목록 |
| POST | `/api/ai/credit-rates` | 비율 추가 |
| PATCH | `/api/ai/credit-rates/[id]` | 비율 수정 |
| DELETE | `/api/ai/credit-rates/[id]` | 비율 비활성화 |
| GET | `/api/ai/providers` | 프로바이더 설정 목록 |
| PATCH | `/api/ai/providers/[feature]` | 설정 변경 |

### 5.6 거래 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/transactions` | 전체 거래 내역 |
| GET | `/api/transactions/export` | 엑셀 내보내기 |

### 5.7 프로모션 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/promotions` | 프로모션 코드 목록 |
| POST | `/api/promotions` | 코드 생성 |
| PATCH | `/api/promotions/[id]` | 코드 수정 |
| DELETE | `/api/promotions/[id]` | 코드 삭제 |
| GET | `/api/promotions/[id]/usages` | 사용 이력 |

### 5.8 작업 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/jobs` | 작업 목록 |
| GET | `/api/jobs/[id]` | 작업 상세 |
| POST | `/api/jobs/[id]/retry` | 재시도 |
| POST | `/api/jobs/[id]/cancel` | 취소 |

### 5.9 로그 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/audit-logs` | 시스템 감사 로그 |
| GET | `/api/admin-logs` | 관리자 활동 로그 |

### 5.10 관리자 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/admins` | 관리자 목록 |
| POST | `/api/admins` | 관리자 추가 |
| PATCH | `/api/admins/[id]` | 역할 변경 |
| DELETE | `/api/admins/[id]` | 관리자 제거 |

### 5.11 시스템 설정 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/settings` | 설정 목록 |
| PATCH | `/api/settings/[key]` | 설정 변경 |

---

## 6. 구축 단계별 태스크

### Phase 1: 프로젝트 초기 설정 및 인증

#### 프롬프트 1.1: 프로젝트 생성 및 기본 설정
```markdown
## 태스크: Next.js 프로젝트 초기 설정

1. Next.js 14 프로젝트 생성 (tiro-admin)
   - App Router 사용
   - TypeScript 활성화
   - TailwindCSS 설정
   - ESLint + Prettier 설정

2. 디렉토리 구조 생성
   - src/app/(auth)/, src/app/(admin)/
   - src/components/ui/, src/components/layouts/, src/components/features/
   - src/lib/auth/, src/lib/db/, src/lib/api/, src/lib/utils/
   - src/types/, src/hooks/

3. 환경변수 파일 설정
   - .env.example 생성
   - .env.local 설정 (DATABASE_URL, NEXTAUTH_*, GOOGLE_*)

4. package.json 스크립트 설정
   - dev, build, start, lint, format

5. 기본 tsconfig.json, tailwind.config.js 설정
```

#### 프롬프트 1.2: Prisma 및 DB 스키마 설정
```markdown
## 태스크: Prisma 설정 및 관리자 테이블 마이그레이션

1. Prisma 설치 및 초기화
   - 기존 TIRO DB 연결 설정
   - prisma/schema.prisma 생성

2. 기존 TIRO 테이블 스키마 가져오기 (prisma db pull)

3. 관리자 전용 테이블 추가
   - AdminWhitelist 모델
   - AdminActivityLog 모델
   - SystemSetting 모델
   - AdminRole enum

4. 마이그레이션 생성 및 적용
   - prisma migrate dev --name add_admin_tables

5. 초기 시드 데이터 생성
   - 첫 번째 SUPER_ADMIN 이메일 등록
   - prisma/seed.ts 작성
```

#### 프롬프트 1.3: Google OAuth 인증 구현
```markdown
## 태스크: NextAuth.js Google 인증 + 화이트리스트 검증

1. NextAuth.js 설치 및 설정
   - next-auth 패키지 설치
   - Google Provider 설정

2. 인증 설정 파일 생성
   - src/lib/auth/config.ts
   - callbacks: signIn에서 화이트리스트 검증
   - callbacks: session에서 role 정보 추가

3. API 라우트 생성
   - src/app/api/auth/[...nextauth]/route.ts

4. 로그인 페이지 UI 구현
   - src/app/(auth)/login/page.tsx
   - Google 로그인 버튼
   - 에러 메시지 표시 (미승인 이메일)

5. 인증 미들웨어 구현
   - middleware.ts
   - 보호된 라우트 (/dashboard, /users 등) 접근 제어

6. 세션 관리 설정
   - SessionProvider 래퍼
   - useSession 훅 사용
```

---

### Phase 2: 공통 컴포넌트 및 레이아웃

#### 프롬프트 2.1: UI 컴포넌트 기반 구축
```markdown
## 태스크: shadcn/ui 설치 및 공통 컴포넌트

1. shadcn/ui 설치 및 설정
   - npx shadcn-ui@latest init
   - components.json 설정

2. 기본 UI 컴포넌트 추가
   - Button, Input, Select, Checkbox
   - Card, Badge, Alert
   - Dialog (Modal), Sheet
   - Table, Pagination
   - Tabs, Accordion
   - Toast (Sonner)
   - DropdownMenu, Command (검색)

3. 커스텀 컴포넌트 생성
   - DataTable (정렬, 필터, 검색, 페이지네이션)
   - StatCard (통계 카드)
   - PageHeader (페이지 제목 + 액션 버튼)
   - ConfirmDialog (확인 모달)
   - LoadingSpinner
```

#### 프롬프트 2.2: 레이아웃 컴포넌트
```markdown
## 태스크: 관리자 레이아웃 컴포넌트

1. AdminLayout 컴포넌트
   - src/components/layouts/AdminLayout.tsx
   - Header + Sidebar + Main 구조

2. Header 컴포넌트
   - 로고, 검색바, 관리자 정보, 로그아웃

3. Sidebar 컴포넌트
   - 네비게이션 메뉴
   - 활성 메뉴 하이라이트
   - 아이콘 + 텍스트
   - 접힘/펼침 기능

4. 레이아웃 적용
   - src/app/(admin)/layout.tsx
```

#### 프롬프트 2.3: API 유틸리티 및 타입 정의
```markdown
## 태스크: API 클라이언트 및 타입 정의

1. API 클라이언트 설정
   - src/lib/api/client.ts (fetch wrapper)
   - 에러 핸들링
   - 인증 헤더 자동 추가

2. 타입 정의
   - src/types/user.ts
   - src/types/project.ts
   - src/types/transaction.ts
   - src/types/job.ts
   - src/types/admin.ts

3. Zod 스키마 정의
   - src/lib/validators/user.schema.ts
   - src/lib/validators/promotion.schema.ts
   - src/lib/validators/admin.schema.ts

4. 관리자 활동 로그 유틸리티
   - src/lib/utils/admin-logger.ts
   - logAdminActivity(action, target, details)
```

---

### Phase 3: 대시보드

#### 프롬프트 3.1: 대시보드 API 및 UI
```markdown
## 태스크: 대시보드 통계 API 및 페이지

1. 통계 API 구현
   - GET /api/stats/overview
     - 총 사용자 수, 오늘 가입자, 활성 프로젝트, 오늘 AI 사용량
   - GET /api/stats/usage
     - 7일간 일별 가입자 수, AI 사용량
   - GET /api/stats/jobs
     - 상태별 작업 수

2. 대시보드 페이지 구현
   - src/app/(admin)/dashboard/page.tsx

3. 대시보드 컴포넌트
   - StatCards (4개 통계 카드)
   - UsageChart (Recharts 라인 차트)
   - RecentUsers (최근 가입자 테이블)
   - PendingJobs (대기 작업 테이블)
```

---

### Phase 4: 사용자 관리

#### 프롬프트 4.1: 사용자 목록 API 및 UI
```markdown
## 태스크: 사용자 목록 조회

1. API 구현
   - GET /api/users
     - Query: search, plan, status, page, limit, sortBy, sortOrder
     - Response: { users, total, page, totalPages }

2. 사용자 목록 페이지
   - src/app/(admin)/users/page.tsx

3. 컴포넌트
   - UserFilters (검색, 플랜 필터, 상태 필터)
   - UserTable (DataTable 기반)
   - 컬럼: 이메일, 이름, 플랜, 크레딧, 가입일, 상태, 액션
```

#### 프롬프트 4.2: 사용자 상세 및 관리 API/UI
```markdown
## 태스크: 사용자 상세 조회 및 관리 기능

1. API 구현
   - GET /api/users/[id] (상세 정보)
   - PATCH /api/users/[id] (정보 수정)
   - DELETE /api/users/[id] (비활성화)
   - POST /api/users/[id]/credits (크레딧 조정)
   - POST /api/users/[id]/plan (플랜 변경)
   - GET /api/users/[id]/projects
   - GET /api/users/[id]/transactions

2. 사용자 상세 페이지
   - src/app/(admin)/users/[id]/page.tsx

3. 컴포넌트
   - UserProfileCard (프로필 정보 + 수정)
   - UserCreditsCard (크레딧 현황 + 조정 모달)
   - UserPlanCard (플랜 정보 + 변경 모달)
   - UserProjectsTable
   - UserTransactionsTable
   - CreditAdjustModal
   - PlanChangeModal
```

---

### Phase 5: 프로젝트 관리

#### 프롬프트 5.1: 프로젝트 관리 API 및 UI
```markdown
## 태스크: 프로젝트 목록 및 상세 관리

1. API 구현
   - GET /api/projects (목록, 검색, 필터)
   - GET /api/projects/[id] (상세)
   - PATCH /api/projects/[id] (상태 변경)
   - DELETE /api/projects/[id] (삭제)
   - GET /api/projects/[id]/episodes

2. 프로젝트 목록 페이지
   - src/app/(admin)/projects/page.tsx
   - ProjectFilters, ProjectTable

3. 프로젝트 상세 페이지
   - src/app/(admin)/projects/[id]/page.tsx
   - ProjectInfoCard
   - ProjectStatsCard (회차 수, 토큰 사용량)
   - EpisodesTable
   - StatusChangeModal
```

---

### Phase 6: AI 설정 관리

#### 프롬프트 6.1: 크레딧 비율 관리
```markdown
## 태스크: AI 크레딧 비율 관리 API 및 UI

1. API 구현
   - GET /api/ai/credit-rates
   - POST /api/ai/credit-rates
   - PATCH /api/ai/credit-rates/[id]
   - DELETE /api/ai/credit-rates/[id]

2. 크레딧 비율 관리 페이지
   - src/app/(admin)/ai/credit-rates/page.tsx

3. 컴포넌트
   - CreditRatesTable (프로바이더별 그룹)
   - CreditRateEditModal
   - AddModelModal
```

#### 프롬프트 6.2: 프로바이더 설정 관리
```markdown
## 태스크: AI 프로바이더 설정 관리 API 및 UI

1. API 구현
   - GET /api/ai/providers
   - PATCH /api/ai/providers/[feature]

2. 프로바이더 설정 페이지
   - src/app/(admin)/ai/providers/page.tsx

3. 컴포넌트
   - ProviderConfigTable
   - ProviderConfigEditModal
```

---

### Phase 7: 크레딧/거래 관리

#### 프롬프트 7.1: 거래 내역 조회
```markdown
## 태스크: 크레딧 거래 내역 조회 API 및 UI

1. API 구현
   - GET /api/transactions
     - Query: type, userId, startDate, endDate, page, limit
   - GET /api/transactions/export (CSV)

2. 거래 내역 페이지
   - src/app/(admin)/credits/page.tsx

3. 컴포넌트
   - TransactionFilters (타입, 날짜 범위, 사용자)
   - TransactionsTable
   - ExportButton
```

---

### Phase 8: 프로모션 코드 관리

#### 프롬프트 8.1: 프로모션 코드 CRUD
```markdown
## 태스크: 프로모션 코드 관리 API 및 UI

1. API 구현
   - GET /api/promotions
   - POST /api/promotions
   - PATCH /api/promotions/[id]
   - DELETE /api/promotions/[id]
   - GET /api/promotions/[id]/usages

2. 프로모션 코드 페이지
   - src/app/(admin)/promotions/page.tsx

3. 컴포넌트
   - PromotionTable
   - PromotionCreateModal
   - PromotionEditModal
   - PromotionUsagesModal
```

---

### Phase 9: 작업 모니터링

#### 프롬프트 9.1: 작업 모니터링 API 및 UI
```markdown
## 태스크: 비동기 작업 모니터링 API 및 UI

1. API 구현
   - GET /api/jobs (목록, 상태 필터)
   - GET /api/jobs/[id] (상세)
   - POST /api/jobs/[id]/retry
   - POST /api/jobs/[id]/cancel

2. 작업 모니터링 페이지
   - src/app/(admin)/jobs/page.tsx

3. 컴포넌트
   - JobStatusTabs (전체/대기/진행/완료/실패)
   - JobsTable (자동 새로고침)
   - JobDetailModal
   - RetryButton, CancelButton
```

---

### Phase 10: 감사 로그

#### 프롬프트 10.1: 감사 로그 조회
```markdown
## 태스크: 감사 로그 조회 API 및 UI

1. API 구현
   - GET /api/audit-logs (시스템 로그)
   - GET /api/admin-logs (관리자 활동 로그)

2. 감사 로그 페이지
   - src/app/(admin)/audit-logs/page.tsx

3. 컴포넌트
   - LogTypeTabs (시스템 / 관리자 활동)
   - LogFilters (액션, 사용자, 날짜)
   - LogsTable
   - LogDetailModal
```

---

### Phase 11: 관리자 설정

#### 프롬프트 11.1: 관리자 화이트리스트 관리
```markdown
## 태스크: 관리자 화이트리스트 관리 API 및 UI

1. API 구현
   - GET /api/admins
   - POST /api/admins
   - PATCH /api/admins/[id]
   - DELETE /api/admins/[id]

2. 관리자 관리 페이지
   - src/app/(admin)/settings/admins/page.tsx
   - SUPER_ADMIN 권한 체크

3. 컴포넌트
   - AdminsTable
   - AddAdminModal
   - RoleChangeModal
```

#### 프롬프트 11.2: 시스템 설정 관리
```markdown
## 태스크: 시스템 설정 관리 API 및 UI

1. API 구현
   - GET /api/settings
   - PATCH /api/settings/[key]

2. 시스템 설정 페이지
   - src/app/(admin)/settings/system/page.tsx
   - SUPER_ADMIN 권한 체크

3. 컴포넌트
   - SettingsCard (카테고리별)
   - SettingEditModal
```

---

### Phase 12: 테스트 및 배포

#### 프롬프트 12.1: E2E 테스트
```markdown
## 태스크: Playwright E2E 테스트

1. Playwright 설치 및 설정
   - playwright.config.ts

2. 테스트 케이스 작성
   - tests/e2e/auth.spec.ts (로그인 플로우)
   - tests/e2e/users.spec.ts (사용자 관리)
   - tests/e2e/promotions.spec.ts (프로모션 코드)

3. 테스트 헬퍼
   - tests/helpers/auth.helper.ts
```

#### 프롬프트 12.2: 배포 설정
```markdown
## 태스크: Vercel 배포 설정

1. Vercel 프로젝트 생성
   - vercel.json 설정

2. 환경변수 설정
   - DATABASE_URL
   - NEXTAUTH_URL, NEXTAUTH_SECRET
   - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

3. 도메인 설정
   - admin.tiro.app (예시)

4. CI/CD 설정
   - GitHub 연동
   - Preview 배포 설정
```

---

## 7. 프로젝트 디렉토리 구조

```
tiro-admin/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (admin)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── users/
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── projects/
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── ai/
│   │   │   │   ├── credit-rates/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── providers/
│   │   │   │       └── page.tsx
│   │   │   ├── credits/
│   │   │   │   └── page.tsx
│   │   │   ├── promotions/
│   │   │   │   └── page.tsx
│   │   │   ├── jobs/
│   │   │   │   └── page.tsx
│   │   │   ├── audit-logs/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── admins/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── system/
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts
│   │   │   ├── stats/
│   │   │   │   ├── overview/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── usage/
│   │   │   │   │   └── route.ts
│   │   │   │   └── jobs/
│   │   │   │       └── route.ts
│   │   │   ├── users/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── credits/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── plan/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── projects/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── transactions/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── projects/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── episodes/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── ai/
│   │   │   │   ├── credit-rates/
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   └── providers/
│   │   │   │       ├── [feature]/
│   │   │   │       │   └── route.ts
│   │   │   │       └── route.ts
│   │   │   ├── transactions/
│   │   │   │   ├── export/
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── promotions/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── usages/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── jobs/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── retry/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── cancel/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── audit-logs/
│   │   │   │   └── route.ts
│   │   │   ├── admin-logs/
│   │   │   │   └── route.ts
│   │   │   ├── admins/
│   │   │   │   ├── [id]/
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   └── settings/
│   │   │       ├── [key]/
│   │   │       │   └── route.ts
│   │   │       └── route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                    # shadcn/ui 컴포넌트
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── card.tsx
│   │   │   └── ...
│   │   ├── layouts/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   └── features/
│   │       ├── dashboard/
│   │       │   ├── StatCards.tsx
│   │       │   ├── UsageChart.tsx
│   │       │   ├── RecentUsers.tsx
│   │       │   └── PendingJobs.tsx
│   │       ├── users/
│   │       │   ├── UserFilters.tsx
│   │       │   ├── UserTable.tsx
│   │       │   ├── UserProfileCard.tsx
│   │       │   ├── UserCreditsCard.tsx
│   │       │   ├── CreditAdjustModal.tsx
│   │       │   └── PlanChangeModal.tsx
│   │       ├── projects/
│   │       │   ├── ProjectFilters.tsx
│   │       │   ├── ProjectTable.tsx
│   │       │   └── ProjectInfoCard.tsx
│   │       ├── ai/
│   │       │   ├── CreditRatesTable.tsx
│   │       │   ├── CreditRateEditModal.tsx
│   │       │   ├── ProviderConfigTable.tsx
│   │       │   └── ProviderConfigEditModal.tsx
│   │       ├── promotions/
│   │       │   ├── PromotionTable.tsx
│   │       │   ├── PromotionCreateModal.tsx
│   │       │   └── PromotionUsagesModal.tsx
│   │       ├── jobs/
│   │       │   ├── JobStatusTabs.tsx
│   │       │   ├── JobsTable.tsx
│   │       │   └── JobDetailModal.tsx
│   │       ├── logs/
│   │       │   ├── LogFilters.tsx
│   │       │   ├── LogsTable.tsx
│   │       │   └── LogDetailModal.tsx
│   │       └── settings/
│   │           ├── AdminsTable.tsx
│   │           ├── AddAdminModal.tsx
│   │           └── SettingsCard.tsx
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── config.ts          # NextAuth 설정
│   │   │   └── whitelist.ts       # 화이트리스트 검증
│   │   ├── db/
│   │   │   └── prisma.ts          # Prisma 클라이언트
│   │   ├── api/
│   │   │   └── client.ts          # fetch wrapper
│   │   ├── utils/
│   │   │   ├── admin-logger.ts    # 관리자 활동 로깅
│   │   │   ├── format.ts          # 포맷팅 유틸
│   │   │   └── id-generator.ts    # ID 생성
│   │   └── validators/
│   │       ├── user.schema.ts
│   │       ├── promotion.schema.ts
│   │       └── admin.schema.ts
│   ├── types/
│   │   ├── user.ts
│   │   ├── project.ts
│   │   ├── transaction.ts
│   │   ├── job.ts
│   │   ├── promotion.ts
│   │   └── admin.ts
│   └── hooks/
│       ├── useAdmin.ts            # 관리자 정보 훅
│       └── useDataTable.ts        # 데이터 테이블 훅
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── tests/
│   └── e2e/
│       ├── auth.spec.ts
│       ├── users.spec.ts
│       └── helpers/
│           └── auth.helper.ts
├── public/
│   └── logo.svg
├── .env.example
├── .env.local
├── .eslintrc.json
├── .prettierrc
├── middleware.ts
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## 8. 환경변수 설정

### .env.example

```env
# Database (기존 TIRO DB)
DATABASE_URL="postgresql://user:password@localhost:5432/tiro?schema=public"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# 초기 SUPER_ADMIN 이메일 (최초 시드 데이터용)
INITIAL_ADMIN_EMAIL="admin@example.com"
```

---

## 9. 보안 고려사항

### 9.1 접근 제어
- **화이트리스트 기반**: `admin_whitelist` 테이블에 등록된 이메일만 로그인 허용
- **역할 기반 권한**: ADMIN / SUPER_ADMIN 구분
  - SUPER_ADMIN: 관리자 추가/삭제, 시스템 설정 변경 가능
  - ADMIN: 일반 관리 기능만 사용 가능

### 9.2 활동 로깅
- 모든 관리자 활동을 `admin_activity_logs` 테이블에 기록
- 변경 전/후 데이터를 JSON으로 저장
- IP 주소, User Agent 기록

### 9.3 세션 관리
- 세션 타임아웃: 30분 비활동 시 자동 로그아웃
- JWT 토큰 사용 (httpOnly 쿠키)

### 9.4 추가 보안 옵션 (선택)
- IP 제한: 특정 IP 대역만 접근 허용
- 2FA: Google Authenticator 연동

---

## 10. 일정 예상

| Phase | 예상 소요 |
|-------|----------|
| Phase 1: 프로젝트 초기 설정 및 인증 | 1일 |
| Phase 2: 공통 컴포넌트 및 레이아웃 | 1일 |
| Phase 3: 대시보드 | 0.5일 |
| Phase 4: 사용자 관리 | 1일 |
| Phase 5: 프로젝트 관리 | 0.5일 |
| Phase 6: AI 설정 관리 | 0.5일 |
| Phase 7: 크레딧/거래 관리 | 0.5일 |
| Phase 8: 프로모션 코드 관리 | 0.5일 |
| Phase 9: 작업 모니터링 | 0.5일 |
| Phase 10: 감사 로그 | 0.5일 |
| Phase 11: 관리자 설정 | 0.5일 |
| Phase 12: 테스트 및 배포 | 1일 |
| **총 예상** | **약 8일** |

---

## 11. 참고 사항

### 11.1 기존 TIRO 프로젝트와의 관계
- 동일한 PostgreSQL 데이터베이스 사용
- Prisma 스키마는 별도 관리 (관리자 테이블만 포함)
- 기존 테이블은 읽기/쓰기 권한으로 접근

### 11.2 배포 환경
- TIRO 메인: `app.tiro.example.com`
- TIRO 관리자: `admin.tiro.example.com`
- 별도 Vercel 프로젝트로 배포

### 11.3 향후 확장 가능 기능
- 공지사항 관리
- FAQ 관리
- 이메일 발송 관리
- 정산/결제 관리
- 사용자 문의 관리

---

**문서 버전**: v1.0
**작성일**: 2025-12-12
**작성자**: AI Assistant
