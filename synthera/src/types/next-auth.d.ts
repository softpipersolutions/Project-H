import type { UserType, SubscriptionTier, Creator, Subscription } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
      username: string
      displayName: string
      type: UserType
      subscriptionTier: SubscriptionTier
      isVerified: boolean
      creatorProfile?: Creator | null
      activeSubscription?: Subscription | null
    }
  }

  interface User {
    id: string
    email: string
    name: string
    image?: string
    username: string
    displayName: string
    type: UserType
    subscriptionTier: SubscriptionTier
    isVerified: boolean
    creatorProfile?: Creator | null
    activeSubscription?: Subscription | null
  }
}