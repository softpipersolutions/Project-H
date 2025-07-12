import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
  typescript: true,
})

// Stripe configuration
export const STRIPE_CONFIG = {
  currency: 'usd',
  successUrl: `${process.env.NEXTAUTH_URL}/payment/success`,
  cancelUrl: `${process.env.NEXTAUTH_URL}/payment/cancel`,
}

// Product types for Stripe
export enum StripeProductType {
  VIDEO_LICENSE = 'video_license',
  SUBSCRIPTION = 'subscription',
  TIP = 'tip',
}

// License types mapping
export enum LicenseType {
  PERSONAL = 'personal',
  COMMERCIAL = 'commercial',
  EXTENDED = 'extended',
  EXCLUSIVE = 'exclusive',
}

// Subscription tiers
export enum SubscriptionTier {
  PREMIUM = 'premium',
  PRO = 'pro',
}

// Create Stripe customer
export async function createStripeCustomer(
  email: string,
  name: string,
  userId: string
): Promise<Stripe.Customer> {
  return await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
    },
  })
}

// Create payment intent for video license purchase
export async function createVideoLicensePayment({
  videoId,
  licenseType,
  amount,
  customerId,
  metadata = {},
}: {
  videoId: string
  licenseType: LicenseType
  amount: number
  customerId: string
  metadata?: Record<string, string>
}): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: STRIPE_CONFIG.currency,
    customer: customerId,
    metadata: {
      type: StripeProductType.VIDEO_LICENSE,
      videoId,
      licenseType,
      ...metadata,
    },
    automatic_payment_methods: {
      enabled: true,
    },
  })
}

// Create subscription checkout session
export async function createSubscriptionCheckout({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  metadata = {},
}: {
  customerId: string
  priceId: string
  successUrl?: string
  cancelUrl?: string
  metadata?: Record<string, string>
}): Promise<Stripe.Checkout.Session> {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl || STRIPE_CONFIG.successUrl,
    cancel_url: cancelUrl || STRIPE_CONFIG.cancelUrl,
    metadata: {
      type: StripeProductType.SUBSCRIPTION,
      ...metadata,
    },
  })
}

// Create one-time payment checkout session
export async function createOneTimeCheckout({
  customerId,
  lineItems,
  successUrl,
  cancelUrl,
  metadata = {},
}: {
  customerId: string
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[]
  successUrl?: string
  cancelUrl?: string
  metadata?: Record<string, string>
}): Promise<Stripe.Checkout.Session> {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: successUrl || STRIPE_CONFIG.successUrl,
    cancel_url: cancelUrl || STRIPE_CONFIG.cancelUrl,
    metadata,
  })
}

// Create tip payment intent
export async function createTipPayment({
  creatorId,
  amount,
  customerId,
  message,
}: {
  creatorId: string
  amount: number
  customerId: string
  message?: string
}): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: STRIPE_CONFIG.currency,
    customer: customerId,
    metadata: {
      type: StripeProductType.TIP,
      creatorId,
      message: message || '',
    },
    automatic_payment_methods: {
      enabled: true,
    },
  })
}

// Get customer by user ID
export async function getStripeCustomerByUserId(userId: string): Promise<Stripe.Customer | null> {
  const customers = await stripe.customers.list({
    limit: 1,
    expand: ['data.subscriptions'],
  })

  const customer = customers.data.find(
    (customer) => customer.metadata.userId === userId
  )

  return customer || null
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.cancel(subscriptionId)
}

// Update subscription
export async function updateSubscription(
  subscriptionId: string,
  priceId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  
  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: priceId,
      },
    ],
  })
}

// Get subscription details
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['latest_invoice', 'customer'],
  })
}

// Create product for video license
export async function createVideoLicenseProduct({
  videoId,
  videoTitle,
  licenseType,
  price,
}: {
  videoId: string
  videoTitle: string
  licenseType: LicenseType
  price: number
}): Promise<Stripe.Product> {
  const product = await stripe.products.create({
    name: `${videoTitle} - ${licenseType.charAt(0).toUpperCase() + licenseType.slice(1)} License`,
    description: `${licenseType} license for video: ${videoTitle}`,
    metadata: {
      videoId,
      licenseType,
      type: StripeProductType.VIDEO_LICENSE,
    },
  })

  // Create price for the product
  await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(price * 100), // Convert to cents
    currency: STRIPE_CONFIG.currency,
    metadata: {
      videoId,
      licenseType,
    },
  })

  return product
}

// Construct webhook event
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, secret)
}

// Calculate platform fee (Synthera takes a percentage)
export function calculatePlatformFee(amount: number, feePercentage = 0.1): {
  platformFee: number
  creatorAmount: number
} {
  const platformFee = Math.round(amount * feePercentage)
  const creatorAmount = amount - platformFee
  
  return {
    platformFee,
    creatorAmount,
  }
}

// Get payment method details
export async function getPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
  return await stripe.paymentMethods.retrieve(paymentMethodId)
}

// Refund payment
export async function refundPayment(
  paymentIntentId: string,
  amount?: number,
  reason?: Stripe.RefundCreateParams.Reason
): Promise<Stripe.Refund> {
  return await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount ? Math.round(amount * 100) : undefined,
    reason,
  })
}

// Create connected account for creators (for marketplace functionality)
export async function createConnectedAccount({
  email,
  type = 'express',
  country = 'US',
}: {
  email: string
  type?: Stripe.AccountCreateParams.Type
  country?: string
}): Promise<Stripe.Account> {
  return await stripe.accounts.create({
    type,
    email,
    country,
  })
}

// Transfer funds to creator (marketplace functionality)
export async function transferToCreator({
  amount,
  destination,
  metadata = {},
}: {
  amount: number
  destination: string
  metadata?: Record<string, string>
}): Promise<Stripe.Transfer> {
  return await stripe.transfers.create({
    amount: Math.round(amount * 100),
    currency: STRIPE_CONFIG.currency,
    destination,
    metadata,
  })
}