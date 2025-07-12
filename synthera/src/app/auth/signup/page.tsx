'use client'

import { signIn, getSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Github, Chrome, MessageCircle, Sparkles, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        router.push('/dashboard')
      }
    })
  }, [router])

  const handleSignUp = async (provider: string) => {
    setIsLoading(provider)
    try {
      await signIn(provider, { 
        callbackUrl: '/onboarding',
        redirect: true 
      })
    } catch (error) {
      console.error('Sign up error:', error)
    } finally {
      setIsLoading(null)
    }
  }

  const benefits = [
    'Upload and monetize your AI-generated videos',
    'Access to premium creator tools and analytics',
    'Join an exclusive community of digital artists',
    'Multiple revenue streams and licensing options',
    'Verified creator status and profile customization',
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Benefits */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Join the Future of
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {' '}Digital Creativity
              </span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Start creating, sharing, and monetizing premium AI-generated video content today.
            </p>
          </div>

          <div className="space-y-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sign Up Form */}
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">Synthera</span>
            </div>
            <CardTitle className="text-2xl">Create Your Account</CardTitle>
            <CardDescription>
              Choose your preferred sign-up method to get started
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => handleSignUp('google')}
              disabled={isLoading === 'google'}
            >
              <Chrome className="w-5 h-5 mr-2" />
              {isLoading === 'google' ? 'Creating account...' : 'Sign up with Google'}
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => handleSignUp('github')}
              disabled={isLoading === 'github'}
            >
              <Github className="w-5 h-5 mr-2" />
              {isLoading === 'github' ? 'Creating account...' : 'Sign up with GitHub'}
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => handleSignUp('discord')}
              disabled={isLoading === 'discord'}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              {isLoading === 'discord' ? 'Creating account...' : 'Sign up with Discord'}
            </Button>

            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/auth/signin" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </div>

            <div className="text-center pt-2">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                ← Back to homepage
              </Link>
            </div>

            <div className="text-xs text-muted-foreground text-center pt-4 border-t">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}