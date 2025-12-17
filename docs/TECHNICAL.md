# TIRO Admin 기술 명세서

> **문서 버전**: v1.0
> **최종 업데이트**: 2025-12-17
> **목적**: TIRO 관리자 사이트의 기술 스택, 구현 패턴, 코딩 가이드라인 정의

---

## 1. 기술 스택

### 1.1 핵심 기술

| 구분 | 기술 | 버전 | 용도 |
|------|------|------|------|
| **프레임워크** | Next.js | 14.x (App Router) | 풀스택 React 프레임워크 |
| **언어** | TypeScript | 5.x | 타입 안전성 |
| **런타임** | Node.js | 20.x | 서버 런타임 |
| **UI 라이브러리** | React | 18.x | UI 컴포넌트 |

### 1.2 스타일링

| 기술 | 용도 |
|------|------|
| TailwindCSS | 유틸리티 기반 CSS |
| shadcn/ui | 컴포넌트 라이브러리 |
| Radix UI | 접근성 기반 UI 프리미티브 |

### 1.3 데이터베이스

| 기술 | 용도 |
|------|------|
| PostgreSQL | 관계형 데이터베이스 (TIRO DB 공유) |
| Prisma | ORM 및 쿼리 빌더 |

### 1.4 인증

| 기술 | 용도 |
|------|------|
| NextAuth.js | 인증 프레임워크 |
| Google OAuth 2.0 | OAuth 프로바이더 |

### 1.5 유틸리티

| 기술 | 용도 |
|------|------|
| Zod | 스키마 검증 |
| React Hook Form | 폼 관리 |
| date-fns | 날짜 처리 |
| Recharts | 차트 라이브러리 |
| Lucide React | 아이콘 |

---

## 2. 프로젝트 설정

### 2.1 환경변수

```env
# .env.example

# Database (기존 TIRO DB)
DATABASE_URL="postgresql://user:password@localhost:5432/tiro?schema=public"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# 초기 SUPER_ADMIN 이메일 (시드 데이터용)
INITIAL_ADMIN_EMAIL="admin@example.com"
```

### 2.2 스크립트

```json
{
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio"
  }
}
```

---

## 3. 코딩 컨벤션

### 3.1 파일 네이밍

| 타입 | 패턴 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `UserTable.tsx` |
| 훅 | camelCase (use 접두사) | `useAdmin.ts` |
| 유틸리티 | kebab-case | `admin-logger.ts` |
| 타입 | kebab-case | `user.ts` |
| API 라우트 | kebab-case 디렉토리 | `api/users/[id]/route.ts` |

### 3.2 컴포넌트 구조

```typescript
// 권장 컴포넌트 구조
'use client'; // 클라이언트 컴포넌트인 경우에만

import { useState, useEffect } from 'react';
import type { ComponentProps } from './types';

// Props 인터페이스 정의
interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
}

// 컴포넌트 구현
export function UserTable({ users, onEdit, onDelete }: UserTableProps) {
  // 상태 선언
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // 이펙트
  useEffect(() => {
    // ...
  }, []);

  // 이벤트 핸들러
  const handleRowClick = (user: User) => {
    setSelectedUser(user);
  };

  // 렌더링
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### 3.3 API 라우트 패턴

```typescript
// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/config';
import { apiResponse, apiError } from '@/lib/api/response';

// GET 핸들러
export async function GET(request: NextRequest) {
  try {
    // 1. 인증 확인
    const session = await getServerSession(authOptions);
    if (!session) {
      return apiError('Unauthorized', 401);
    }

    // 2. 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // 3. 데이터 조회
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    // 4. 응답 반환
    return apiResponse({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return apiError('Internal Server Error', 500);
  }
}
```

### 3.4 API 응답 형식

```typescript
// 성공 응답
{
  "success": true,
  "data": {
    // 응답 데이터
  }
}

// 에러 응답
{
  "success": false,
  "error": {
    "message": "에러 메시지",
    "code": "ERROR_CODE" // 선택사항
  }
}

// 페이지네이션 응답
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

## 4. 구현 패턴

### 4.1 인증 패턴

#### NextAuth 설정 (`src/lib/auth/config.ts`)

```typescript
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/db/prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // 화이트리스트 확인
      const admin = await prisma.adminWhitelist.findUnique({
        where: { email: user.email!, isActive: true },
      });
      return !!admin;
    },
    async session({ session, token }) {
      // 세션에 role 추가
      if (session.user?.email) {
        const admin = await prisma.adminWhitelist.findUnique({
          where: { email: session.user.email },
        });
        session.user.role = admin?.role || 'ADMIN';
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};
```

#### 세션 확인 (`src/lib/auth/session.ts`)

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from './config';

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireSuperAdmin() {
  const session = await requireAuth();
  if (session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden');
  }
  return session;
}
```

### 4.2 데이터베이스 패턴

#### Prisma 클라이언트 싱글톤 (`src/lib/db/prisma.ts`)

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

#### 트랜잭션 패턴

```typescript
// 여러 작업을 원자적으로 수행
await prisma.$transaction(async (tx) => {
  // 크레딧 조정
  await tx.user.update({
    where: { id: userId },
    data: { chargedCredit: { increment: amount } },
  });

  // 거래 내역 생성
  await tx.creditTransaction.create({
    data: {
      userId,
      amount,
      type: 'BONUS',
      description: '관리자 수동 지급',
    },
  });

  // 활동 로그 기록
  await tx.adminActivityLog.create({
    data: {
      adminEmail: session.user.email,
      action: 'user.credit_adjust',
      targetType: 'user',
      targetId: userId,
      details: { amount, reason: '관리자 수동 지급' },
    },
  });
});
```

### 4.3 관리자 활동 로깅

```typescript
// src/lib/utils/admin-logger.ts
import { prisma } from '@/lib/db/prisma';
import { headers } from 'next/headers';

interface LogActivityParams {
  adminEmail: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
}

export async function logAdminActivity({
  adminEmail,
  action,
  targetType,
  targetId,
  details,
}: LogActivityParams) {
  const headersList = headers();
  const ipAddress = headersList.get('x-forwarded-for') || 'unknown';
  const userAgent = headersList.get('user-agent') || 'unknown';

  await prisma.adminActivityLog.create({
    data: {
      adminEmail,
      action,
      targetType,
      targetId,
      details,
      ipAddress,
      userAgent,
    },
  });
}
```

### 4.4 폼 검증 패턴

```typescript
// Zod 스키마 정의
import { z } from 'zod';

export const creditAdjustSchema = z.object({
  amount: z.number()
    .int('정수만 입력 가능합니다')
    .min(-1000000, '최소 -1,000,000 크레딧')
    .max(1000000, '최대 1,000,000 크레딧'),
  reason: z.string()
    .min(1, '사유를 입력해주세요')
    .max(500, '500자 이내로 입력해주세요'),
});

export type CreditAdjustInput = z.infer<typeof creditAdjustSchema>;

// API에서 사용
const result = creditAdjustSchema.safeParse(body);
if (!result.success) {
  return apiError(result.error.errors[0].message, 400);
}
```

### 4.5 API 클라이언트 패턴

```typescript
// src/lib/api/client.ts
interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url = `${endpoint}?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'API 요청 실패');
  }

  return data.data;
}

// 사용 예시
const users = await apiClient<{ users: User[] }>('/api/users', {
  params: { page: '1', limit: '20' },
});
```

---

## 5. 컴포넌트 가이드라인

### 5.1 서버 컴포넌트 vs 클라이언트 컴포넌트

#### 서버 컴포넌트 사용 (기본)
- 데이터 페칭
- 데이터베이스 직접 접근
- 민감한 정보 접근 (API 키 등)

```typescript
// 서버 컴포넌트 예시 (use client 없음)
import { prisma } from '@/lib/db/prisma';

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
  });

  return <UserTable users={users} />;
}
```

#### 클라이언트 컴포넌트 사용
- 이벤트 핸들러 (onClick, onChange 등)
- 상태 관리 (useState, useReducer)
- 브라우저 API 사용
- 훅 사용 (useEffect 등)

```typescript
'use client';

import { useState } from 'react';

export function UserFilters({ onFilter }: Props) {
  const [search, setSearch] = useState('');

  return (
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  );
}
```

### 5.2 레이아웃 패턴

```typescript
// src/app/(admin)/layout.tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { AdminLayout } from '@/components/layouts/AdminLayout';

export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <AdminLayout user={session.user}>
      {children}
    </AdminLayout>
  );
}
```

### 5.3 모달/다이얼로그 패턴

```typescript
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface EditUserModalProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: UpdateUserInput) => Promise<void>;
}

export function EditUserModal({ user, open, onClose, onSave }: EditUserModalProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: UpdateUserInput) => {
    setLoading(true);
    try {
      await onSave(data);
      onClose();
    } catch (error) {
      // 에러 처리
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>사용자 수정</DialogTitle>
        </DialogHeader>
        {/* 폼 내용 */}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={() => handleSubmit(formData)} disabled={loading}>
            {loading ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 6. 에러 처리

### 6.1 API 에러 처리

```typescript
// src/lib/api/response.ts
import { NextResponse } from 'next/server';

export function apiResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400, code?: string) {
  return NextResponse.json(
    { success: false, error: { message, code } },
    { status }
  );
}
```

### 6.2 클라이언트 에러 처리

```typescript
// 컴포넌트에서 에러 처리
const [error, setError] = useState<string | null>(null);

const handleSave = async () => {
  try {
    setError(null);
    await apiClient('/api/users/' + userId, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  } catch (err) {
    setError(err instanceof Error ? err.message : '오류가 발생했습니다');
  }
};
```

---

## 7. 보안 가이드라인

### 7.1 필수 보안 사항

1. **인증 확인**: 모든 API 엔드포인트에서 세션 확인
2. **권한 확인**: SUPER_ADMIN 전용 기능은 역할 확인
3. **입력 검증**: Zod를 통한 모든 입력 데이터 검증
4. **SQL Injection 방지**: Prisma 파라미터 바인딩 사용
5. **XSS 방지**: React의 자동 이스케이핑 활용

### 7.2 민감 데이터 처리

```typescript
// 사용자 비밀번호는 절대 반환하지 않음
const user = await prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    name: true,
    // password: false (명시적으로 제외)
  },
});
```

### 7.3 활동 로깅 필수 항목

| 액션 | 로깅 필수 |
|------|----------|
| 크레딧 조정 | O |
| 플랜 변경 | O |
| 사용자 삭제/비활성화 | O |
| 프로젝트 삭제 | O |
| 관리자 추가/삭제 | O |
| 시스템 설정 변경 | O |

---

## 8. 성능 최적화

### 8.1 데이터베이스 쿼리

```typescript
// 필요한 필드만 선택
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
    subscriptionTier: true,
    createdAt: true,
  },
});

// 관계 데이터는 필요한 경우에만
const userWithProjects = await prisma.user.findUnique({
  where: { id },
  include: {
    projects: {
      select: { id: true, title: true },
      take: 10,
    },
  },
});
```

### 8.2 페이지네이션

```typescript
// 커서 기반 페이지네이션 (대용량 데이터)
const users = await prisma.user.findMany({
  take: 20,
  skip: 1, // 커서 스킵
  cursor: { id: lastUserId },
  orderBy: { id: 'asc' },
});

// 오프셋 기반 페이지네이션 (일반적인 경우)
const users = await prisma.user.findMany({
  skip: (page - 1) * limit,
  take: limit,
});
```

### 8.3 React 최적화

```typescript
// 메모이제이션
import { useMemo, useCallback } from 'react';

const filteredUsers = useMemo(
  () => users.filter(u => u.name.includes(search)),
  [users, search]
);

const handleEdit = useCallback((user: User) => {
  setSelectedUser(user);
}, []);
```

---

## 9. 테스트 가이드라인

### 9.1 테스트 구조

```
tests/
├── unit/           # 유닛 테스트
├── integration/    # 통합 테스트
└── e2e/           # E2E 테스트 (Playwright)
```

### 9.2 테스트 네이밍

```typescript
// describe: 테스트 대상
describe('UserService', () => {
  // it: 테스트 케이스 (should로 시작)
  it('should return user by id', async () => {
    // ...
  });

  it('should throw error when user not found', async () => {
    // ...
  });
});
```

---

## 10. 배포

### 10.1 환경별 설정

| 환경 | URL | 용도 |
|------|-----|------|
| Development | localhost:3001 | 로컬 개발 |
| Preview | *.vercel.app | PR 미리보기 |
| Production | admin.tiro.example.com | 운영 환경 |

### 10.2 배포 체크리스트

- [ ] 환경변수 설정 확인
- [ ] 데이터베이스 마이그레이션 완료
- [ ] 빌드 성공 확인
- [ ] 기본 기능 테스트

---

*이 문서는 기술적 변경 시 반드시 업데이트되어야 합니다.*
