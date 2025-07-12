'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Check, 
  Crown, 
  Zap, 
  Star, 
  Loader2, 
  AlertCircle,
  Sparkles,
  Video,
  Download,
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  icon: React.ReactNode
  badge?: string
  features: string[]
  popular?: boolean
}

const plans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Browser',
    description: 'Perfect for discovering AI videos',
    monthlyPrice: 0,
    yearlyPrice: 0,
    icon: <Video className="w-6 h-6" />,
    features: [
      'Browse public videos',
      'Basic search and filtering',
      'Community access',
      'Standard video quality',
      '5 likes per day',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'For serious creators and collectors',
    monthlyPrice: 19.99,
    yearlyPrice: 199.99,
    icon: <Zap className="w-6 h-6" />,
    badge: 'Most Popular',
    popular: true,
    features: [
      'Upload unlimited videos',
      'Advanced analytics dashboard',
      'Priority customer support',
      'HD video downloads',
      'Custom creator profile',
      'Unlimited likes and follows',
      'Early access to new features',
      'Reduced platform fees (5%)',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For professional creators and studios',
    monthlyPrice: 49.99,
    yearlyPrice: 499.99,
    icon: <Crown className="w-6 h-6" />,
    badge: 'Best Value',
    features: [
      'Everything in Premium',
      'Advanced video processing',
      '4K video support',
      'API access for integrations',
      'White-label solutions',
      'Dedicated account manager',
      'Custom licensing terms',
      'No platform fees',
      'Advanced revenue analytics',
      'Priority video processing',
    ],
  },
]

export function SubscriptionPlans() {
  const { data: session } = useSession()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const response = await fetch('/api/payments/create-subscription')
      if (!response.ok) return null
      return response.json()
    },
    enabled: !!session,
  })

  const subscribeMutation = useMutation({
    mutationFn: async ({ tier, billing }: { tier: string; billing: string }) => {
      const response = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, billing }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create subscription')
      }

      return response.json()
    },
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      window.location.href = data.checkoutUrl
    },
  })

  const handleSubscribe = async (planId: string) => {
    if (!session) {
      // Redirect to sign in
      window.location.href = '/auth/signin'
      return
    }

    if (planId === 'free') {
      // Free plan doesn't require payment
      return
    }

    setSelectedPlan(planId)
    subscribeMutation.mutate({
      tier: planId,
      billing: billingCycle,
    })
  }

  const getCurrentTier = () => {
    if (!session) return 'free'
    return session.user.subscriptionTier?.toLowerCase() || 'free'
  }

  const getSavings = (monthly: number, yearly: number) => {
    const monthlyCost = monthly * 12
    const savings = monthlyCost - yearly
    const percentage = Math.round((savings / monthlyCost) * 100)
    return { amount: savings, percentage }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Choose Your{' '}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Creative Journey
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Unlock the full potential of AI video creation and monetization
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center mb-8">
        <div className="bg-secondary rounded-lg p-1 flex">
          <button
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'yearly'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setBillingCycle('yearly')}
          >
            Yearly
            <Badge variant="accent" className="ml-2 text-xs">
              Save 20%
            </Badge>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {plans.map((plan) => {
          const isCurrentPlan = getCurrentTier() === plan.id
          const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
          const savings = getSavings(plan.monthlyPrice, plan.yearlyPrice)

          return (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular
                  ? 'border-primary shadow-lg scale-105'
                  : 'border-border hover:border-primary/50'
              } transition-all duration-300`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge variant="accent" className="px-3 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  {plan.icon}
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                </div>
                <CardDescription className="text-base">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Pricing */}
                <div className="text-center">
                  <div className="flex items-baseline justify-center space-x-1">
                    <span className="text-4xl font-bold">
                      {price === 0 ? 'Free' : formatPrice(price)}
                    </span>
                    {price > 0 && (
                      <span className="text-muted-foreground">
                        /{billingCycle === 'monthly' ? 'month' : 'year'}
                      </span>
                    )}
                  </div>
                  
                  {billingCycle === 'yearly' && price > 0 && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Save {formatPrice(savings.amount)} ({savings.percentage}% off)
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <div className="pt-4">
                  {isCurrentPlan ? (
                    <Button className="w-full" disabled>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={subscribeMutation.isPending && selectedPlan === plan.id}
                    >
                      {subscribeMutation.isPending && selectedPlan === plan.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {plan.id === 'free' ? (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Get Started
                            </>
                          ) : (
                            <>
                              <Crown className="w-4 h-4 mr-2" />
                              Upgrade to {plan.name}
                            </>
                          )}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Error Display */}
      {subscribeMutation.isError && (
        <Card className="border-destructive max-w-md mx-auto">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Subscription Error</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {subscribeMutation.error?.message || 'Failed to create subscription'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Feature Comparison */}
      <div className="mt-16">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-2">Compare Plans</CardTitle>
            <CardDescription>
              See what&apos;s included in each subscription tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-4">Features</th>
                    <th className="text-center py-4 px-4">Browser</th>
                    <th className="text-center py-4 px-4">Premium</th>
                    <th className="text-center py-4 px-4">Pro</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b">
                    <td className="py-3 px-4">Video Uploads</td>
                    <td className="text-center py-3 px-4">❌</td>
                    <td className="text-center py-3 px-4">✅ Unlimited</td>
                    <td className="text-center py-3 px-4">✅ Unlimited</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Video Quality</td>
                    <td className="text-center py-3 px-4">Standard</td>
                    <td className="text-center py-3 px-4">HD</td>
                    <td className="text-center py-3 px-4">4K</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Platform Fees</td>
                    <td className="text-center py-3 px-4">N/A</td>
                    <td className="text-center py-3 px-4">5%</td>
                    <td className="text-center py-3 px-4">0%</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Analytics</td>
                    <td className="text-center py-3 px-4">❌</td>
                    <td className="text-center py-3 px-4">✅ Advanced</td>
                    <td className="text-center py-3 px-4">✅ Professional</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">API Access</td>
                    <td className="text-center py-3 px-4">❌</td>
                    <td className="text-center py-3 px-4">❌</td>
                    <td className="text-center py-3 px-4">✅</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Support</td>
                    <td className="text-center py-3 px-4">Community</td>
                    <td className="text-center py-3 px-4">Priority</td>
                    <td className="text-center py-3 px-4">Dedicated</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Can I change plans anytime?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect 
                immediately for upgrades, or at the end of your current billing cycle for downgrades.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We accept all major credit cards, PayPal, and bank transfers. All payments 
                are processed securely through Stripe.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Is there a free trial?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes! You can start with our free Browser plan to explore the platform. 
                Premium and Pro plans offer a 14-day money-back guarantee.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How do platform fees work?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Platform fees are deducted from your video sales. Premium users pay 5%, 
                while Pro users pay no platform fees at all.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}