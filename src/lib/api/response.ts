import { NextResponse } from 'next/server'

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function badRequestResponse(message = 'Bad request') {
  return NextResponse.json({ error: message, message }, { status: 400 })
}

export function notFoundResponse(message = 'Not found') {
  return NextResponse.json({ error: message }, { status: 404 })
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbiddenResponse(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}

export function serverErrorResponse(message = 'Internal server error') {
  return NextResponse.json({ error: message }, { status: 500 })
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export function getPaginationParams(searchParams: URLSearchParams): PaginationParams {
  return {
    page: Math.max(1, parseInt(searchParams.get('page') || '1', 10)),
    limit: Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10))),
    sortBy: searchParams.get('sortBy') || undefined,
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
  }
}
