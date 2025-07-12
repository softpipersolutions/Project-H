'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Navbar } from '@/components/navigation/navbar'
import { VideoPlayer } from '@/components/video/video-player'
import { PaymentModal } from '@/components/payment/payment-modal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Heart, 
  Share2, 
  Download, 
  Eye, 
  Calendar, 
  Clock, 
  Zap, 
  Star,
  Play,
  DollarSign,
  Shield,
  Globe,
  Building,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { formatDuration, formatNumber, formatPrice, formatRelativeTime } from '@/lib/utils'
import { LicenseType } from '@/lib/stripe'

interface VideoData {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  videoUrl: string
  duration: number
  fileSize: number
  resolution: string
  aiModel: string
  prompts: string[]
  tags: string[]
  category: string
  style: string
  aspectRatio: string
  fps: number
  views: number
  likes: number
  purchases: number
  revenue: number
  comments: number
  isPublic: boolean
  isFeatured: boolean
  pricing: {
    personalLicense?: number
    commercialLicense?: number
    extendedLicense?: number
    exclusiveRights?: number
    isAvailableForSale: boolean
  }
  createdAt: string
  creator: {
    id: string
    username: string
    displayName: string
    avatar?: string
    isVerified: boolean
  }
}

export default function VideoDetailPage() {
  const params = useParams()
  const { data: session } = useSession()
  const [isLiked, setIsLiked] = useState(false)
  const [currentViews, setCurrentViews] = useState(0)
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean
    type: 'video_license' | 'tip'
    licenseType?: LicenseType
    amount?: number
  }>({
    isOpen: false,
    type: 'video_license'
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['video', params.id],
    queryFn: async () => {
      const response = await fetch(`/api/videos/${params.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch video')
      }
      return response.json()
    },
  })

  const video: VideoData | undefined = data?.video

  useEffect(() => {
    if (video) {
      setCurrentViews(video.views)
    }
  }, [video])

  const handleTimeUpdate = (currentTime: number, duration: number) => {
    // Track video viewing progress for analytics
    const progress = (currentTime / duration) * 100
    if (progress > 25 && progress < 30) {
      // User has watched 25% of the video, count as a view
      setCurrentViews(prev => prev + 1)
    }
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handlePurchaseLicense = (licenseType: LicenseType, amount: number) => {
    if (!session) {
      // Redirect to sign in
      window.location.href = '/auth/signin'
      return
    }

    setPaymentModal({
      isOpen: true,
      type: 'video_license',
      licenseType,
      amount,
    })
  }

  const handleSendTip = () => {
    if (!session) {
      // Redirect to sign in
      window.location.href = '/auth/signin'
      return
    }

    setPaymentModal({
      isOpen: true,
      type: 'tip',
      amount: 5, // Default tip amount
    })
  }

  const getLicenseIcon = (type: string) => {
    switch (type) {
      case 'personal':
        return <Heart className="w-4 h-4" />
      case 'commercial':
        return <Building className="w-4 h-4" />
      case 'extended':
        return <Globe className="w-4 h-4" />
      case 'exclusive':
        return <Shield className="w-4 h-4" />
      default:
        return <Download className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto border-destructive">
            <CardHeader className="text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-2" />
              <CardTitle>Video Not Found</CardTitle>
              <CardDescription>
                The video you&apos;re looking for doesn&apos;t exist or has been removed.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  const licenses = [
    { 
      type: 'personal' as LicenseType, 
      name: 'Personal License', 
      price: video.pricing.personalLicense,
      description: 'For personal use only' 
    },
    { 
      type: 'commercial' as LicenseType, 
      name: 'Commercial License', 
      price: video.pricing.commercialLicense,
      description: 'For commercial projects' 
    },
    { 
      type: 'extended' as LicenseType, 
      name: 'Extended License', 
      price: video.pricing.extendedLicense,
      description: 'Unlimited commercial use' 
    },
    { 
      type: 'exclusive' as LicenseType, 
      name: 'Exclusive Rights', 
      price: video.pricing.exclusiveRights,
      description: 'Full ownership and rights' 
    },
  ].filter(license => license.price && license.price > 0)

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Player Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <div className="aspect-video">
              <VideoPlayer
                src={video.videoUrl}
                poster={video.thumbnailUrl}
                title={video.title}
                onTimeUpdate={handleTimeUpdate}
                className="w-full h-full"
              />
            </div>

            {/* Video Info */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{formatNumber(currentViews)} views</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>{formatNumber(video.likes)} likes</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatRelativeTime(new Date(video.createdAt))}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary">
                      {video.category.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline">
                      {video.style}
                    </Badge>
                    {video.isFeatured && (
                      <Badge variant="accent">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsLiked(!isLiked)}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                    Like
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Creator Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={video.creator.avatar} />
                      <AvatarFallback>
                        {getUserInitials(video.creator.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{video.creator.displayName}</h3>
                        {video.creator.isVerified && (
                          <Badge variant="accent" className="text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">@{video.creator.username}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline">Follow</Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={handleSendTip}
                      >
                        <DollarSign className="w-4 h-4 mr-1" />
                        Tip
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About this video</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {video.description}
                  </p>

                  {/* AI Prompts */}
                  {video.prompts.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center space-x-2">
                        <Zap className="w-4 h-4" />
                        <span>AI Prompts</span>
                      </h4>
                      <div className="space-y-2">
                        {video.prompts.map((prompt, index) => (
                          <div key={index} className="bg-secondary/50 p-3 rounded-lg">
                            <p className="text-sm">{prompt}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {video.tags.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {video.tags.map((tag, index) => (
                          <Badge key={index} variant="outline">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Video Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Play className="w-5 h-5" />
                  <span>Video Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(video.duration)}</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolution</span>
                  <span>{video.resolution}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aspect Ratio</span>
                  <span>{video.aspectRatio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frame Rate</span>
                  <span>{video.fps} FPS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">AI Model</span>
                  <Badge variant="secondary" className="text-xs">
                    {video.aiModel}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Licensing */}
            {video.pricing.isAvailableForSale && licenses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5" />
                    <span>License Options</span>
                  </CardTitle>
                  <CardDescription>
                    Choose the license that fits your needs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {licenses.map((license) => (
                    <div key={license.type} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getLicenseIcon(license.type)}
                          <span className="font-medium">{license.name}</span>
                        </div>
                        <span className="font-bold text-accent">
                          {formatPrice(license.price!)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {license.description}
                      </p>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => handlePurchaseLicense(license.type, license.price!)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Purchase License
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Views</span>
                  <span className="font-medium">{formatNumber(currentViews)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Likes</span>
                  <span className="font-medium">{formatNumber(video.likes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchases</span>
                  <span className="font-medium">{formatNumber(video.purchases)}</span>
                </div>
                {video.revenue > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revenue</span>
                    <span className="font-medium">{formatPrice(video.revenue)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Payment Modal */}
        <PaymentModal
          isOpen={paymentModal.isOpen}
          onClose={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
          type={paymentModal.type}
          videoId={video.id}
          creatorId={video.creator.id}
          licenseType={paymentModal.licenseType}
          amount={paymentModal.amount || 0}
        />

        {/* Related Videos */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">More from {video.creator.displayName}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* This would be populated with actual related videos */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-secondary/20 rounded-lg aspect-video flex items-center justify-center">
                <span className="text-muted-foreground">Related Video {i}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}