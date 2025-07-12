'use client'

import { Navbar } from '@/components/navigation/navbar'
import { SubscriptionPlans } from '@/components/payment/subscription-plans'

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <SubscriptionPlans />
      </main>
    </div>
  )
}