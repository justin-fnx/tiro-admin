-- ============================================
-- TIRO Admin 데이터베이스 스키마
-- ============================================
-- 문서 버전: v1.0
-- 최종 업데이트: 2025-12-17
-- 데이터베이스: PostgreSQL 15+
-- ORM: Prisma 6.x
-- ============================================

-- 참고: 이 파일은 문서화 목적으로 작성되었습니다.
-- 실제 스키마 관리는 Prisma를 통해 수행됩니다.
-- prisma/schema.prisma 파일이 단일 진실 소스(Single Source of Truth)입니다.

-- ============================================
-- ENUM 타입 정의
-- ============================================

-- 관리자 역할
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'SUPER_ADMIN');

-- 구독 등급
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'BASIC', 'PRO', 'ENTERPRISE');

-- 크레딧 타입
CREATE TYPE "CreditType" AS ENUM ('SUBSCRIPTION', 'CHARGED');

-- 프로모션 코드 타입
CREATE TYPE "PromotionCodeType" AS ENUM ('PUBLIC', 'PRIVATE');

-- 프로젝트 상태
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED', 'DELETED');

-- 회차 상태
CREATE TYPE "EpisodeStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'PUBLISHED', 'ARCHIVED');

-- 생성 모드
CREATE TYPE "GenerationMode" AS ENUM ('INSTANT', 'BATCH');

-- 설정 타입
CREATE TYPE "SettingType" AS ENUM ('LIST', 'TEXT');

-- 크레딧 거래 타입
CREATE TYPE "CreditTransactionType" AS ENUM (
    'PURCHASE', 'INITIAL_CREDIT', 'USAGE', 'REFUND', 'BONUS', 'SUBSCRIPTION'
);

-- 크레딧 거래 상태
CREATE TYPE "CreditTransactionStatus" AS ENUM ('SUCCESS', 'FAILED');

-- 비동기 작업 타입
CREATE TYPE "AsyncJobType" AS ENUM (
    'EPISODE_GENERATION', 'BATCH_GENERATION', 'REVIEW', 'AUTO_FIX',
    'BULK_EDIT', 'EXPORT', 'GRAMMAR_REVIEW', 'SETTINGS_REVIEW', 'ANALYZE'
);

-- 비동기 작업 상태
CREATE TYPE "AsyncJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- 리뷰 범위
CREATE TYPE "ReviewScope" AS ENUM ('EPISODE', 'RANGE', 'ALL', 'SETTINGS');

-- 리뷰 상태
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- 채팅 역할
CREATE TYPE "ChatRole" AS ENUM ('USER', 'ASSISTANT');

-- AI 기능
CREATE TYPE "AiFeature" AS ENUM (
    'EPISODE_GENERATION', 'EPISODE_REWRITE', 'SETTING_SUGGESTION', 'REVIEW',
    'CONTEXT_SNAPSHOT', 'ICON_SUGGESTION', 'JSON_FIX', 'GRAMMAR_REVIEW',
    'SETTINGS_REVIEW', 'ANALYZE', 'ASSISTANT'
);

-- 사용자 리포트 타입
CREATE TYPE "UserReportType" AS ENUM ('BUG', 'QUESTION', 'FEATURE', 'OTHER');

-- 사용자 리포트 상태
CREATE TYPE "UserReportStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');


-- ============================================
-- 관리자 전용 테이블 (Admin Specific)
-- ============================================

-- 관리자 화이트리스트
-- TIRO Admin에 접근 가능한 관리자 이메일 목록
CREATE TABLE admin_whitelist (
    id VARCHAR(30) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    role "AdminRole" NOT NULL DEFAULT 'ADMIN',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(30),
    last_login_at TIMESTAMP
);

CREATE INDEX idx_admin_whitelist_email ON admin_whitelist(email);
CREATE INDEX idx_admin_whitelist_is_active ON admin_whitelist(is_active);

COMMENT ON TABLE admin_whitelist IS '관리자 이메일 화이트리스트';
COMMENT ON COLUMN admin_whitelist.email IS '관리자 Google 이메일';
COMMENT ON COLUMN admin_whitelist.role IS '관리자 역할 (ADMIN: 일반, SUPER_ADMIN: 최고)';
COMMENT ON COLUMN admin_whitelist.is_active IS '활성화 여부';
COMMENT ON COLUMN admin_whitelist.created_by IS '생성한 관리자 ID';


-- 관리자 활동 로그
-- 모든 관리자 활동을 추적하기 위한 감사 로그
CREATE TABLE admin_activity_logs (
    id VARCHAR(30) PRIMARY KEY,
    admin_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id VARCHAR(30),
    details JSONB,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_activity_admin_email ON admin_activity_logs(admin_email);
CREATE INDEX idx_admin_activity_action ON admin_activity_logs(action);
CREATE INDEX idx_admin_activity_target ON admin_activity_logs(target_type, target_id);
CREATE INDEX idx_admin_activity_created ON admin_activity_logs(created_at DESC);

COMMENT ON TABLE admin_activity_logs IS '관리자 활동 로그';
COMMENT ON COLUMN admin_activity_logs.action IS '수행한 액션 (예: user.credit_adjust, user.plan_change)';
COMMENT ON COLUMN admin_activity_logs.target_type IS '대상 타입 (예: user, project, promotion_code)';
COMMENT ON COLUMN admin_activity_logs.details IS '변경 상세 내용 (JSON)';


-- 시스템 설정
-- 관리자가 관리하는 시스템 설정 값 (key-value)
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255)
);

COMMENT ON TABLE system_settings IS '시스템 설정 (key-value)';
COMMENT ON COLUMN system_settings.key IS '설정 키';
COMMENT ON COLUMN system_settings.value IS '설정 값 (JSON)';
COMMENT ON COLUMN system_settings.updated_by IS '마지막 수정한 관리자 이메일';


-- ============================================
-- TIRO 공유 테이블 (관리자가 조회/수정하는 테이블)
-- ============================================

-- 사용자 테이블
CREATE TABLE users (
    id VARCHAR(30) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    password VARCHAR(255),
    avatar TEXT,
    subscription_tier "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    subscription_expiry TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMP,
    deleted_at TIMESTAMP,
    email_verification_token VARCHAR(255),
    email_verification_token_expires_at TIMESTAMP,
    email_verified_at TIMESTAMP,
    is_email_verified BOOLEAN NOT NULL DEFAULT false,
    charged_credit INTEGER NOT NULL DEFAULT 0,
    daily_credit INTEGER NOT NULL DEFAULT 0,
    daily_credit_reset_at TIMESTAMP,
    weekly_credit INTEGER NOT NULL DEFAULT 0,
    weekly_credit_reset_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_users_email_verification_token ON users(email_verification_token);

COMMENT ON TABLE users IS 'TIRO 서비스 사용자';
COMMENT ON COLUMN users.charged_credit IS '충전 크레딧 (유료 결제)';
COMMENT ON COLUMN users.daily_credit IS '일간 무료 크레딧';
COMMENT ON COLUMN users.weekly_credit IS '주간 무료 크레딧';


-- 프로젝트 테이블
CREATE TABLE projects (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(100),
    target_episodes INTEGER,
    description TEXT,
    status "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    current_episode INTEGER NOT NULL DEFAULT 0,
    settings_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    writing_style VARCHAR(255)
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);

COMMENT ON TABLE projects IS '웹소설 프로젝트';


-- 회차 테이블
CREATE TABLE episodes (
    id VARCHAR(30) PRIMARY KEY,
    project_id VARCHAR(30) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    title VARCHAR(255),
    summary TEXT,
    events JSONB NOT NULL DEFAULT '[]',
    context_snapshot JSONB,
    word_count INTEGER NOT NULL DEFAULT 0,
    character_count INTEGER NOT NULL DEFAULT 0,
    estimated_reading_time INTEGER NOT NULL DEFAULT 0,
    status "EpisodeStatus" NOT NULL DEFAULT 'DRAFT',
    generation_mode "GenerationMode",
    prompt_used TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    published_at TIMESTAMP,
    active_revision_id VARCHAR(30) UNIQUE,
    credits_used INTEGER NOT NULL DEFAULT 0,
    UNIQUE(project_id, episode_number)
);

CREATE INDEX idx_episodes_user_id ON episodes(user_id);
CREATE INDEX idx_episodes_project_id ON episodes(project_id);
CREATE INDEX idx_episodes_status ON episodes(status);

COMMENT ON TABLE episodes IS '프로젝트 회차';


-- 크레딧 거래 내역
CREATE TABLE credit_transactions (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type "CreditTransactionType" NOT NULL,
    description TEXT,
    credit_type "CreditType",
    payment_id VARCHAR(100),
    payment_method VARCHAR(50),
    price_krw INTEGER,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    status "CreditTransactionStatus" NOT NULL DEFAULT 'SUCCESS',
    failed_at TIMESTAMP,
    failed_reason TEXT
);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX idx_credit_transactions_credit_type ON credit_transactions(credit_type);
CREATE INDEX idx_credit_transactions_status ON credit_transactions(status);

COMMENT ON TABLE credit_transactions IS '크레딧 거래 내역';
COMMENT ON COLUMN credit_transactions.amount IS '거래량 (양수: 증가, 음수: 감소)';


-- 비동기 작업
CREATE TABLE async_jobs (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id VARCHAR(30) REFERENCES projects(id) ON DELETE CASCADE,
    episode_id VARCHAR(30) REFERENCES episodes(id) ON DELETE CASCADE,
    job_type "AsyncJobType" NOT NULL,
    status "AsyncJobStatus" NOT NULL DEFAULT 'PENDING',
    progress INTEGER NOT NULL DEFAULT 0,
    input JSONB NOT NULL,
    result JSONB,
    error TEXT,
    estimated_duration INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    credits_used INTEGER NOT NULL DEFAULT 0,
    timeout INTEGER,
    dismissed BOOLEAN NOT NULL DEFAULT false,
    depends_on_job_id VARCHAR(30)
);

CREATE INDEX idx_async_jobs_user_id ON async_jobs(user_id);
CREATE INDEX idx_async_jobs_project_id ON async_jobs(project_id);
CREATE INDEX idx_async_jobs_episode_id ON async_jobs(episode_id);
CREATE INDEX idx_async_jobs_status ON async_jobs(status);
CREATE INDEX idx_async_jobs_job_type ON async_jobs(job_type);
CREATE INDEX idx_async_jobs_depends_on_job_id ON async_jobs(depends_on_job_id);

COMMENT ON TABLE async_jobs IS '비동기 작업 대기열';


-- AI 크레딧 비율
CREATE TABLE ai_credit_rates (
    id VARCHAR(30) PRIMARY KEY,
    provider VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    input FLOAT NOT NULL,
    output FLOAT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(provider, model)
);

CREATE INDEX idx_ai_credit_rates_provider ON ai_credit_rates(provider);
CREATE INDEX idx_ai_credit_rates_is_active ON ai_credit_rates(is_active);

COMMENT ON TABLE ai_credit_rates IS 'AI 모델별 크레딧 비율';
COMMENT ON COLUMN ai_credit_rates.input IS '입력 토큰당 크레딧 비율';
COMMENT ON COLUMN ai_credit_rates.output IS '출력 토큰당 크레딧 비율';


-- AI 프로바이더 설정
CREATE TABLE ai_provider_configs (
    id VARCHAR(30) PRIMARY KEY,
    feature "AiFeature" UNIQUE NOT NULL,
    provider VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_provider_configs_feature ON ai_provider_configs(feature);
CREATE INDEX idx_ai_provider_configs_is_active ON ai_provider_configs(is_active);

COMMENT ON TABLE ai_provider_configs IS 'AI 기능별 프로바이더/모델 설정';


-- 프로모션 코드
CREATE TABLE promotion_codes (
    id VARCHAR(30) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    type "PromotionCodeType" NOT NULL,
    credit_amount INTEGER NOT NULL,
    quota INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_promotion_codes_code ON promotion_codes(code);
CREATE INDEX idx_promotion_codes_is_active ON promotion_codes(is_active);

COMMENT ON TABLE promotion_codes IS '프로모션 코드';
COMMENT ON COLUMN promotion_codes.quota IS '최대 사용 가능 횟수 (NULL = 무제한)';


-- 프로모션 코드 사용 이력
CREATE TABLE promotion_code_usages (
    id VARCHAR(30) PRIMARY KEY,
    promotion_code_id VARCHAR(30) NOT NULL REFERENCES promotion_codes(id) ON DELETE CASCADE,
    user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credit_amount INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(promotion_code_id, user_id)
);

CREATE INDEX idx_promotion_code_usages_promotion_code_id ON promotion_code_usages(promotion_code_id);
CREATE INDEX idx_promotion_code_usages_user_id ON promotion_code_usages(user_id);

COMMENT ON TABLE promotion_code_usages IS '프로모션 코드 사용 이력';


-- 시스템 감사 로그 (TIRO 공유)
CREATE TABLE audit_logs (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30),
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(50),
    entity_id VARCHAR(30),
    changes JSONB,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

COMMENT ON TABLE audit_logs IS '시스템 감사 로그 (TIRO 공유)';


-- 사용자 리포트 (버그, 질문, 기능 제안 등)
CREATE TABLE user_reports (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type "UserReportType" NOT NULL DEFAULT 'BUG',
    status "UserReportStatus" NOT NULL DEFAULT 'PENDING',
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    page_url VARCHAR(500),
    user_agent VARCHAR(500),
    metadata JSONB NOT NULL DEFAULT '{}',
    admin_note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_reports_user_id ON user_reports(user_id);
CREATE INDEX idx_user_reports_type ON user_reports(type);
CREATE INDEX idx_user_reports_status ON user_reports(status);
CREATE INDEX idx_user_reports_created_at ON user_reports(created_at);

COMMENT ON TABLE user_reports IS '사용자 리포트 (버그, 질문, 기능 제안)';
COMMENT ON COLUMN user_reports.admin_note IS '관리자 메모';


-- ============================================
-- 트리거 함수
-- ============================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
CREATE TRIGGER update_admin_whitelist_updated_at
    BEFORE UPDATE ON admin_whitelist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- 초기 데이터 (시드)
-- ============================================

-- 최초 SUPER_ADMIN 등록 (환경변수에서 이메일 가져옴)
-- 실제 시드는 prisma/seed.ts에서 수행

-- 예시 시스템 설정
INSERT INTO system_settings (key, value, description) VALUES
    ('default_daily_credit', '100', '신규 사용자 기본 일간 크레딧'),
    ('default_weekly_credit', '500', '신규 사용자 기본 주간 크레딧'),
    ('max_projects_free', '3', 'FREE 플랜 최대 프로젝트 수'),
    ('max_projects_basic', '10', 'BASIC 플랜 최대 프로젝트 수'),
    ('max_projects_pro', '50', 'PRO 플랜 최대 프로젝트 수'),
    ('max_projects_enterprise', '-1', 'ENTERPRISE 플랜 최대 프로젝트 수 (-1 = 무제한)')
ON CONFLICT (key) DO NOTHING;


-- ============================================
-- 테이블 관계 다이어그램 (참고용)
-- ============================================
/*
관리자 전용:
┌──────────────────┐
│ admin_whitelist  │
├──────────────────┤
│ id (PK)          │
│ email (UNIQUE)   │
│ role             │
│ is_active        │
└──────────────────┘

┌──────────────────────┐
│ admin_activity_logs  │
├──────────────────────┤
│ id (PK)              │
│ admin_email          │
│ action               │
│ target_type          │
│ target_id            │
│ details (JSONB)      │
└──────────────────────┘

┌──────────────────┐
│ system_settings  │
├──────────────────┤
│ key (PK)         │
│ value (JSONB)    │
│ description      │
└──────────────────┘

TIRO 공유:
┌─────────────┐       ┌──────────────┐       ┌───────────────┐
│    users    │──────<│   projects   │──────<│   episodes    │
├─────────────┤       ├──────────────┤       ├───────────────┤
│ id (PK)     │       │ id (PK)      │       │ id (PK)       │
│ email       │       │ user_id (FK) │       │ project_id(FK)│
│ credits...  │       │ title        │       │ episode_number│
└─────────────┘       │ status       │       │ status        │
       │              └──────────────┘       └───────────────┘
       │
       │        ┌────────────────────────┐
       └───────<│  credit_transactions   │
                ├────────────────────────┤
                │ id (PK)                │
                │ user_id (FK)           │
                │ amount                 │
                │ type                   │
                └────────────────────────┘
*/
