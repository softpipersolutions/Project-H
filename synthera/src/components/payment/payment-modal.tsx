'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { 
  Loader2, 
  CreditCard, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Heart,
  Building,
  Globe,
  Crown
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { LicenseType } from '@/lib/stripe'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const getLicenseIcon = (type: LicenseType) => {
  switch (type) {
    case 'personal':
      return <Heart className="w-5 h-5" />
    case 'commercial':
      return <Building className="w-5 h-5" />
    case 'extended':
      return <Globe className="w-5 h-5" />
    case 'exclusive':
      return <Crown className="w-5 h-5" />
    default:
      return <CreditCard className="w-5 h-5" />
  }
}

const getLicenseDescription = (type: LicenseType) => {
  switch (type) {
    case 'personal':
      return 'For personal use only - no commercial applications'
    case 'commercial':
      return 'For commercial projects and marketing materials'
    case 'extended':
      return 'Unlimited commercial use including resale rights'
    case 'exclusive':
      return 'Full ownership and exclusive rights to this video'
    default:
      return ''
  }
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'video_license' | 'tip'
  videoId?: string
  videoTitle?: string
  licenseType?: LicenseType
  amount: number
  creatorId?: string
  creatorName?: string
  onSuccess?: () => void
}

interface PaymentFormProps extends Omit<PaymentModalProps, 'isOpen'> {
  clientSecret: string
}

export function PaymentModal(props: PaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  
  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: props.type,
          videoId: props.videoId,
          licenseType: props.licenseType,
          amount: props.amount,
          creatorId: props.creatorId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create payment')
      }

      return response.json()
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret)
    },
  })

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      props.onClose()
      setClientSecret(null)
    } else if (open && !clientSecret && !createPaymentMutation.isPending) {
      createPaymentMutation.mutate()
    }
  }


  return (
    <Dialog open={props.isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {props.type === 'video_license' && props.licenseType 
              ? getLicenseIcon(props.licenseType)
              : <CreditCard className="w-5 h-5" />
            }
            <span>
              {props.type === 'video_license' ? 'Purchase License' : 'Send Tip'}
            </span>
          </DialogTitle>
          <DialogDescription>
            {props.type === 'video_license' && props.licenseType
              ? getLicenseDescription(props.licenseType)
              : props.type === 'video_license' 
                ? 'Complete your purchase to download this video'
                : `Send a tip to ${props.creatorName}`
            }
          </DialogDescription>
        </DialogHeader>

        {/* License/Payment Details */}
        {props.type === 'video_license' && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">
                    {props.licenseType ? props.licenseType.charAt(0).toUpperCase() + props.licenseType.slice(1) : 'License'} License
                  </span>
                </div>
                <span className="font-bold text-lg">
                  {formatPrice(props.amount)}
                </span>
              </div>
              {props.videoTitle && (
                <p className="text-sm text-muted-foreground mt-2">
                  For: {props.videoTitle}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {props.type === 'tip' && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Tip Amount</span>
                <span className="font-bold text-lg">
                  {formatPrice(props.amount)}
                </span>
              </div>
              {props.creatorName && (
                <p className="text-sm text-muted-foreground mt-2">
                  Supporting: {props.creatorName}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {createPaymentMutation.isPending && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Preparing payment...</span>
          </div>
        )}

        {createPaymentMutation.isError && (
          <Card className="border-destructive">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Payment Error</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {createPaymentMutation.error?.message || 'Failed to initialize payment'}
              </p>
            </CardContent>
          </Card>
        )}

        {clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'night',
                variables: {
                  colorPrimary: '#3b82f6',
                  colorBackground: '#0a0a0a',
                  colorText: '#ffffff',
                  colorDanger: '#ef4444',
                },
              },
            }}
          >
            <PaymentForm {...props} clientSecret={clientSecret} />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  )
}

function PaymentForm({ 
  type, 
  videoTitle, 
  licenseType, 
  amount, 
  creatorName,
  onSuccess,
  onClose 
}: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'succeeded' | 'failed'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success`,
      },
      redirect: 'if_required',
    })

    if (error) {
      setErrorMessage(error.message || 'Payment failed')
      setPaymentStatus('failed')
      setIsProcessing(false)
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setPaymentStatus('succeeded')
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 2000)
    }

    setIsProcessing(false)
  }

  if (paymentStatus === 'succeeded') {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
        <p className="text-muted-foreground">
          {type === 'video_license' 
            ? 'Your license has been activated. You can now download the video.'
            : 'Your tip has been sent successfully!'
          }
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Purchase Summary */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Purchase Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {type === 'video_license' && licenseType && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getLicenseIcon(licenseType)}
                <div>
                  <div className="font-medium">
                    {licenseType.charAt(0).toUpperCase() + licenseType.slice(1)} License
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {videoTitle}
                  </div>
                </div>
              </div>
              <Badge variant="secondary">
                {formatPrice(amount)}
              </Badge>
            </div>
          )}

          {type === 'tip' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Heart className="w-5 h-5" />
                <div>
                  <div className="font-medium">Tip for {creatorName}</div>
                  <div className="text-sm text-muted-foreground">
                    Show your appreciation
                  </div>
                </div>
              </div>
              <Badge variant="secondary">
                {formatPrice(amount)}
              </Badge>
            </div>
          )}

          {type === 'video_license' && licenseType && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                {getLicenseDescription(licenseType)}
              </p>
            </div>
          )}

          <div className="border-t pt-4 flex items-center justify-between font-medium">
            <span>Total</span>
            <span>{formatPrice(amount)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Payment Details</span>
          </CardTitle>
          <CardDescription>
            Your payment information is secure and encrypted
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentElement />
        </CardContent>
      </Card>

      {errorMessage && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Payment Failed</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {errorMessage}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay {formatPrice(amount)}
            </>
          )}
        </Button>
      </div>

      {/* Security Notice */}
      <div className="text-xs text-muted-foreground text-center">
        <div className="flex items-center justify-center space-x-1">
          <Shield className="w-3 h-3" />
          <span>Secured by Stripe • SSL Encrypted</span>
        </div>
      </div>
    </form>
  )
}