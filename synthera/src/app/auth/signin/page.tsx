'use client'

import { signIn, getSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Github, Chrome, MessageCircle, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function SignInPage() {
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

  const handleSignIn = async (provider: string) => {
    setIsLoading(provider)
    try {
      await signIn(provider, { 
        callbackUrl: '/dashboard',
        redirect: true 
      })
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">Synthera</span>
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your account to continue creating and collecting premium AI videos
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => handleSignIn('google')}
            disabled={isLoading === 'google'}
          >
            <Chrome className="w-5 h-5 mr-2" />
            {isLoading === 'google' ? 'Signing in...' : 'Continue with Google'}
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => handleSignIn('github')}
            disabled={isLoading === 'github'}
          >
            <Github className="w-5 h-5 mr-2" />
            {isLoading === 'github' ? 'Signing in...' : 'Continue with GitHub'}
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => handleSignIn('discord')}
            disabled={isLoading === 'discord'}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            {isLoading === 'discord' ? 'Signing in...' : 'Continue with Discord'}
          </Button>

          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>

          <div className="text-center pt-2">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to homepage
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}