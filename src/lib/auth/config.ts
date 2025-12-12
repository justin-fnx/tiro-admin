import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/db/prisma'
import { AdminRole } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string | null
      image: string | null
      role: AdminRole
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: AdminRole
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        return false
      }

      // 화이트리스트 검증
      const adminEntry = await prisma.adminWhitelist.findUnique({
        where: { email: user.email },
      })

      if (!adminEntry || !adminEntry.isActive) {
        return false
      }

      // 마지막 로그인 시간 업데이트
      await prisma.adminWhitelist.update({
        where: { email: user.email },
        data: { lastLoginAt: new Date() },
      })

      return true
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const adminEntry = await prisma.adminWhitelist.findUnique({
          where: { email: user.email },
        })

        if (adminEntry) {
          token.id = adminEntry.id
          token.role = adminEntry.role
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as AdminRole
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 60, // 30분 세션 타임아웃
  },
}
