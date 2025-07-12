import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import DiscordProvider from 'next-auth/providers/discord'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false

      try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        })

        if (!existingUser) {
          // Create username from email or name
          let username = user.email.split('@')[0]
          
          // Check if username is taken
          const existingUsername = await prisma.user.findUnique({
            where: { username },
          })

          if (existingUsername) {
            username = `${username}_${Math.random().toString(36).substring(7)}`
          }

          // Create new user
          await prisma.user.create({
            data: {
              email: user.email,
              username,
              displayName: user.name || username,
              avatar: user.image,
              type: 'BROWSER',
              subscriptionTier: 'FREE',
            },
          })
        }

        return true
      } catch (error) {
        console.error('Error during sign in:', error)
        return false
      }
    },

    async session({ session }) {
      if (session.user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email! },
          include: {
            creatorProfile: true,
            subscriptions: {
              where: { status: 'ACTIVE' },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        })

        if (dbUser) {
          session.user.id = dbUser.id
          session.user.username = dbUser.username
          session.user.displayName = dbUser.displayName
          session.user.type = dbUser.type
          session.user.subscriptionTier = dbUser.subscriptionTier
          session.user.isVerified = dbUser.isVerified
          session.user.creatorProfile = dbUser.creatorProfile
          session.user.activeSubscription = dbUser.subscriptions[0] || null
        }
      }

      return session
    },

    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
  },
  session: {
    strategy: 'database',
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}