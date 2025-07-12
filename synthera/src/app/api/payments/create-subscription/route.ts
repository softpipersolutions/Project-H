import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  createSubscriptionCheckout, 
  getStripeCustomerByUserId, 
  createStripeCustomer 
} from '@/lib/stripe'

// Stripe Price IDs for subscription tiers (you'll need to create these in Stripe Dashboard)
const SUBSCRIPTION_PRICES = {
  premium_monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_premium_monthly',
  premium_yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || 'price_premium_yearly',
  pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
  pro_yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tier, billing } = body

    if (!tier || !billing) {
      return NextResponse.json(
        { error: 'Missing tier or billing period' },
        { status: 400 }
      )
    }

    if (!['premium', 'pro'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      )
    }

    if (!['monthly', 'yearly'].includes(billing)) {
      return NextResponse.json(
        { error: 'Invalid billing period' },
        { status: 400 }
      )
    }

    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: 'ACTIVE',
      },
    })

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    let customer = await getStripeCustomerByUserId(session.user.id)
    
    if (!customer) {
      customer = await createStripeCustomer(
        session.user.email,
        session.user.displayName || session.user.name,
        session.user.id
      )
    }

    // Get the appropriate price ID
    const priceKey = `${tier}_${billing}` as keyof typeof SUBSCRIPTION_PRICES
    const priceId = SUBSCRIPTION_PRICES[priceKey]

    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid subscription configuration' },
        { status: 400 }
      )
    }

    // Create checkout session
    const checkoutSession = await createSubscriptionCheckout({
      customerId: customer.id,
      priceId,
      successUrl: `${process.env.NEXTAUTH_URL}/dashboard?subscription=success`,
      cancelUrl: `${process.env.NEXTAUTH_URL}/pricing?subscription=canceled`,
      metadata: {
        userId: session.user.id,
        tier,
        billing,
      },
    })

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    })

  } catch (error) {
    console.error('Create subscription error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get subscription details
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['ACTIVE', 'PAST_DUE'] },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ subscription })

  } catch (error) {
    console.error('Get subscription error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}