import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import DiscordProvider from 'next-auth/providers/discord'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
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

    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
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
            token.id = dbUser.id
            token.username = dbUser.username
            token.displayName = dbUser.displayName
            token.type = dbUser.type
            token.subscriptionTier = dbUser.subscriptionTier
            token.isVerified = dbUser.isVerified
            token.creatorProfile = dbUser.creatorProfile
            token.activeSubscription = dbUser.subscriptions[0] || null
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
        }
      }

      if (account) {
        token.accessToken = account.access_token
      }

      return token
    },

    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.displayName = token.displayName as string
        session.user.type = token.type as any
        session.user.subscriptionTier = token.subscriptionTier as any
        session.user.isVerified = token.isVerified as boolean
        session.user.creatorProfile = token.creatorProfile as any
        session.user.activeSubscription = token.activeSubscription as any
      }

      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}