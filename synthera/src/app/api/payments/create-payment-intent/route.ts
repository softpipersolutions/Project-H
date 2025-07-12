import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  createVideoLicensePayment, 
  createTipPayment, 
  getStripeCustomerByUserId, 
  createStripeCustomer,
  LicenseType 
} from '@/lib/stripe'

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
    const { type, videoId, licenseType, amount, creatorId, message } = body

    if (!type || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
      
      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          // You'll need to add stripeCustomerId to your User model
          // stripeCustomerId: customer.id,
        },
      })
    }

    let paymentIntent

    if (type === 'video_license') {
      if (!videoId || !licenseType) {
        return NextResponse.json(
          { error: 'Missing videoId or licenseType for video license purchase' },
          { status: 400 }
        )
      }

      // Verify video exists and get pricing
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        include: { creator: true },
      })

      if (!video) {
        return NextResponse.json(
          { error: 'Video not found' },
          { status: 404 }
        )
      }

      // Verify the license type and price
      let actualPrice = 0
      switch (licenseType) {
        case LicenseType.PERSONAL:
          actualPrice = video.personalLicense || 0
          break
        case LicenseType.COMMERCIAL:
          actualPrice = video.commercialLicense || 0
          break
        case LicenseType.EXTENDED:
          actualPrice = video.extendedLicense || 0
          break
        case LicenseType.EXCLUSIVE:
          actualPrice = video.exclusiveRights || 0
          break
        default:
          return NextResponse.json(
            { error: 'Invalid license type' },
            { status: 400 }
          )
      }

      if (actualPrice === 0) {
        return NextResponse.json(
          { error: 'This license type is not available for purchase' },
          { status: 400 }
        )
      }

      if (Math.abs(actualPrice - amount) > 0.01) {
        return NextResponse.json(
          { error: 'Price mismatch' },
          { status: 400 }
        )
      }

      // Check if user already owns this license
      const existingPurchase = await prisma.purchase.findFirst({
        where: {
          userId: session.user.id,
          videoId,
          licenseType: licenseType.toUpperCase() as 'PERSONAL' | 'COMMERCIAL' | 'EXTENDED' | 'EXCLUSIVE',
          status: 'COMPLETED',
        },
      })

      if (existingPurchase) {
        return NextResponse.json(
          { error: 'You already own this license' },
          { status: 400 }
        )
      }

      paymentIntent = await createVideoLicensePayment({
        videoId,
        licenseType,
        amount,
        customerId: customer.id,
        metadata: {
          userId: session.user.id,
          videoTitle: video.title,
          creatorId: video.creatorId,
        },
      })

      // Create pending purchase record
      await prisma.purchase.create({
        data: {
          userId: session.user.id,
          videoId,
          licenseType: licenseType.toUpperCase() as 'PERSONAL' | 'COMMERCIAL' | 'EXTENDED' | 'EXCLUSIVE',
          amount,
          currency: 'USD',
          stripePaymentId: paymentIntent.id,
          status: 'PENDING',
        },
      })

    } else if (type === 'tip') {
      if (!creatorId) {
        return NextResponse.json(
          { error: 'Missing creatorId for tip payment' },
          { status: 400 }
        )
      }

      // Verify creator exists
      const creator = await prisma.user.findUnique({
        where: { id: creatorId },
      })

      if (!creator) {
        return NextResponse.json(
          { error: 'Creator not found' },
          { status: 404 }
        )
      }

      if (creatorId === session.user.id) {
        return NextResponse.json(
          { error: 'Cannot tip yourself' },
          { status: 400 }
        )
      }

      paymentIntent = await createTipPayment({
        creatorId,
        amount,
        customerId: customer.id,
        message,
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid payment type' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })

  } catch (error) {
    console.error('Create payment intent error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}