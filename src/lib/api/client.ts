// AIDEV-NOTE: 인증이 필요한 API 호출을 위한 클라이언트 wrapper
// 401 응답 시 자동으로 로그인 페이지로 리다이렉트

type FetchOptions = Omit<RequestInit, 'body'> & {
  skipAuthRedirect?: boolean
  body?: BodyInit | null
}

/**
 * 인증이 포함된 fetch wrapper
 * - 자동으로 credentials: 'include' 설정
 * - 401 응답 시 로그인 페이지로 리다이렉트 (callbackUrl 포함)
 */
export async function fetchWithAuth(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { skipAuthRedirect, ...fetchOptions } = options

  const response = await fetch(url, {
    ...fetchOptions,
    credentials: 'include',
  })

  // 401 응답 시 로그인 페이지로 리다이렉트
  if (response.status === 401 && !skipAuthRedirect) {
    const currentPath = window.location.pathname + window.location.search
    const loginUrl = `/login?callbackUrl=${encodeURIComponent(currentPath)}`
    window.location.href = loginUrl
    // 리다이렉트 중에는 에러를 던져서 이후 로직 실행 방지
    throw new Error('인증이 만료되었습니다. 로그인 페이지로 이동합니다.')
  }

  return response
}

// AIDEV-NOTE: apiClient 전용 옵션 타입 - JSON body를 받아서 stringify 처리
type ApiClientOptions = Omit<FetchOptions, 'body'> & {
  body?: unknown
}

/**
 * JSON API 호출을 위한 헬퍼
 */
export async function apiClient<T = unknown>(
  url: string,
  options: ApiClientOptions = {}
): Promise<{ data: T; response: Response }> {
  const { body, ...restOptions } = options

  const fetchOptions: FetchOptions = {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...restOptions.headers,
    },
  }

  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body)
  }

  const response = await fetchWithAuth(url, fetchOptions)

  const data = await response.json()

  if (!response.ok) {
    throw new ApiError(data.message || '요청 처리 중 오류가 발생했습니다.', response.status, data)
  }

  return { data, response }
}

/**
 * API 에러 클래스
 */
export class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

// 편의 메서드들
export const api = {
  get: <T = unknown>(url: string, options?: Omit<ApiClientOptions, 'body'>) =>
    apiClient<T>(url, { ...options, method: 'GET' }),

  post: <T = unknown>(url: string, body?: unknown, options?: Omit<ApiClientOptions, 'body'>) =>
    apiClient<T>(url, { ...options, method: 'POST', body }),

  patch: <T = unknown>(url: string, body?: unknown, options?: Omit<ApiClientOptions, 'body'>) =>
    apiClient<T>(url, { ...options, method: 'PATCH', body }),

  put: <T = unknown>(url: string, body?: unknown, options?: Omit<ApiClientOptions, 'body'>) =>
    apiClient<T>(url, { ...options, method: 'PUT', body }),

  delete: <T = unknown>(url: string, options?: Omit<ApiClientOptions, 'body'>) =>
    apiClient<T>(url, { ...options, method: 'DELETE' }),
}
