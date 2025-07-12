import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { constructWebhookEvent, StripeProductType } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('Missing stripe-signature header')
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    let event: Stripe.Event
    
    try {
      event = constructWebhookEvent(body, signature, webhookSecret)
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    console.log(`Processing webhook event: ${event.type}`)

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { metadata } = paymentIntent

  if (metadata.type === StripeProductType.VIDEO_LICENSE) {
    await handleVideoLicensePurchase(paymentIntent)
  } else if (metadata.type === StripeProductType.TIP) {
    await handleTipPayment(paymentIntent)
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { metadata } = paymentIntent

  // Update purchase record to failed status
  if (metadata.type === StripeProductType.VIDEO_LICENSE) {
    await prisma.purchase.updateMany({
      where: {
        stripePaymentId: paymentIntent.id,
      },
      data: {
        status: 'FAILED',
      },
    })
  }

  console.log(`Payment failed for intent: ${paymentIntent.id}`)
}

async function handleVideoLicensePurchase(paymentIntent: Stripe.PaymentIntent) {
  const { metadata } = paymentIntent
  const { videoId, licenseType, userId } = metadata

  if (!videoId || !licenseType || !userId) {
    console.error('Missing required metadata for video license purchase')
    return
  }

  try {
    // Get the video and user information
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { creator: true },
    })

    if (!video) {
      console.error(`Video not found: ${videoId}`)
      return
    }

    // Create or update purchase record
    const purchase = await prisma.purchase.upsert({
      where: {
        stripePaymentId: paymentIntent.id,
      },
      update: {
        status: 'COMPLETED',
      },
      create: {
        userId,
        videoId,
        licenseType: licenseType.toUpperCase() as 'PERSONAL' | 'COMMERCIAL' | 'EXTENDED' | 'EXCLUSIVE',
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        stripePaymentId: paymentIntent.id,
        status: 'COMPLETED',
      },
    })

    // Update video purchase count and revenue
    await prisma.video.update({
      where: { id: videoId },
      data: {
        purchases: { increment: 1 },
        revenue: { increment: paymentIntent.amount / 100 },
      },
    })

    // Update creator earnings
    const platformFee = Math.round((paymentIntent.amount / 100) * 0.1) // 10% platform fee
    const creatorEarnings = (paymentIntent.amount / 100) - platformFee

    await prisma.creator.update({
      where: { userId: video.creatorId },
      data: {
        totalEarnings: { increment: creatorEarnings },
        monthlyEarnings: { increment: creatorEarnings },
        lifetimeRevenue: { increment: creatorEarnings },
        totalPurchases: { increment: 1 },
      },
    }).catch(() => {
      // Creator profile might not exist, ignore error
    })

    console.log(`Video license purchase completed: ${purchase.id}`)

  } catch (error) {
    console.error('Error processing video license purchase:', error)
  }
}

async function handleTipPayment(paymentIntent: Stripe.PaymentIntent) {
  const { metadata } = paymentIntent
  const { creatorId, userId } = metadata

  if (!creatorId || !userId) {
    console.error('Missing required metadata for tip payment')
    return
  }

  try {
    // Calculate platform fee
    const platformFee = Math.round((paymentIntent.amount / 100) * 0.05) // 5% platform fee for tips
    const creatorAmount = (paymentIntent.amount / 100) - platformFee

    // Update creator earnings
    await prisma.creator.update({
      where: { userId: creatorId },
      data: {
        totalEarnings: { increment: creatorAmount },
        monthlyEarnings: { increment: creatorAmount },
        lifetimeRevenue: { increment: creatorAmount },
      },
    })

    // You could also create a tips table to track individual tips
    // await prisma.tip.create({ ... })

    console.log(`Tip payment completed: $${creatorAmount} to creator ${creatorId}`)

  } catch (error) {
    console.error('Error processing tip payment:', error)
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { metadata } = session

  if (metadata?.type === StripeProductType.SUBSCRIPTION) {
    // Handle subscription purchase
    await handleSubscriptionCheckout(session)
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  
  try {
    // Find user by Stripe customer ID
    const customer = await prisma.user.findFirst({
      where: {
        // You'll need to add stripeCustomerId to your User model
        // stripeCustomerId: customerId,
      },
    })

    if (!customer) {
      console.error(`User not found for Stripe customer: ${customerId}`)
      return
    }

    // Create subscription record
    await prisma.subscription.create({
      data: {
        userId: customer.id,
        tier: subscription.items.data[0].price.lookup_key === 'pro' ? 'PRO' : 'PREMIUM',
        status: 'ACTIVE',
        stripeSubscriptionId: subscription.id,
        // @ts-expect-error - Stripe types are inconsistent
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        // @ts-expect-error - Stripe types are inconsistent
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    })

    // Update user subscription tier
    await prisma.user.update({
      where: { id: customer.id },
      data: {
        subscriptionTier: subscription.items.data[0].price.lookup_key === 'pro' ? 'PRO' : 'PREMIUM',
      },
    })

    console.log(`Subscription created for user: ${customer.id}`)

  } catch (error) {
    console.error('Error processing subscription creation:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    // Update subscription record
    await prisma.subscription.updateMany({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      data: {
        status: subscription.status.toUpperCase() as 'ACTIVE' | 'CANCELED' | 'PAST_DUE',
        // @ts-expect-error - Stripe types are inconsistent
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        // @ts-expect-error - Stripe types are inconsistent
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    })

    console.log(`Subscription updated: ${subscription.id}`)

  } catch (error) {
    console.error('Error processing subscription update:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    // Update subscription status to canceled
    const updatedSubscription = await prisma.subscription.updateMany({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      data: {
        status: 'CANCELED',
      },
    })

    // Update user subscription tier back to FREE
    if (updatedSubscription.count > 0) {
      const subscriptionRecord = await prisma.subscription.findFirst({
        where: {
          stripeSubscriptionId: subscription.id,
        },
        include: { user: true },
      })

      if (subscriptionRecord) {
        await prisma.user.update({
          where: { id: subscriptionRecord.userId },
          data: {
            subscriptionTier: 'FREE',
          },
        })
      }
    }

    console.log(`Subscription canceled: ${subscription.id}`)

  } catch (error) {
    console.error('Error processing subscription cancellation:', error)
  }
}

async function handleSubscriptionCheckout(session: Stripe.Checkout.Session) {
  // Additional logic for subscription checkout completion
  console.log(`Subscription checkout completed: ${session.id}`)
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Handle successful recurring payments
  console.log(`Invoice payment succeeded: ${invoice.id}`)
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Handle failed recurring payments
  // @ts-expect-error - Stripe invoice type issue
  const subscriptionId = invoice.subscription as string
  
  if (subscriptionId) {
    await prisma.subscription.updateMany({
      where: {
        stripeSubscriptionId: subscriptionId,
      },
      data: {
        status: 'PAST_DUE',
      },
    })
  }

  console.log(`Invoice payment failed: ${invoice.id}`)
}