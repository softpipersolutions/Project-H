'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Play, 
  Heart, 
  Eye, 
  Clock, 
  Download,
  Star,
  Verified
} from 'lucide-react'
import { formatDuration, formatNumber, formatPrice, formatRelativeTime } from '@/lib/utils'
import type { Video } from '@/types'

interface VideoCardProps {
  video: Video & {
    creator: {
      id: string
      username: string
      displayName: string
      avatar?: string
      isVerified: boolean
    }
  }
  showCreator?: boolean
  variant?: 'default' | 'compact'
}

export function VideoCard({ video, showCreator = true, variant = 'default' }: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      CINEMATIC: 'bg-purple-500/20 text-purple-300',
      ABSTRACT: 'bg-pink-500/20 text-pink-300',
      PHOTOREALISTIC: 'bg-green-500/20 text-green-300',
      ANIMATION: 'bg-blue-500/20 text-blue-300',
      MOTION_GRAPHICS: 'bg-orange-500/20 text-orange-300',
      EXPERIMENTAL: 'bg-red-500/20 text-red-300',
      NATURE: 'bg-emerald-500/20 text-emerald-300',
      ARCHITECTURE: 'bg-gray-500/20 text-gray-300',
      FASHION: 'bg-rose-500/20 text-rose-300',
      TECHNOLOGY: 'bg-cyan-500/20 text-cyan-300',
    }
    return colors[category as keyof typeof colors] || 'bg-accent/20 text-accent'
  }

  if (variant === 'compact') {
    return (
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 bg-card/50 border-border/50">
        <div className="flex">
          <div className="relative flex-shrink-0 w-32 h-20">
            <Link href={`/video/${video.id}`}>
              <Image
                src={video.thumbnailUrl}
                alt={video.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                onLoad={() => setImageLoaded(true)}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 bg-secondary animate-pulse" />
              )}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <Play className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                {formatDuration(video.duration)}
              </div>
            </Link>
          </div>

          <CardContent className="flex-1 p-3">
            <Link href={`/video/${video.id}`}>
              <h3 className="font-medium text-sm line-clamp-2 group-hover:text-accent transition-colors">
                {video.title}
              </h3>
            </Link>
            {showCreator && (
              <Link href={`/creator/${video.creator.username}`} className="flex items-center space-x-2 mt-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={video.creator.avatar} />
                  <AvatarFallback className="text-xs">
                    {getUserInitials(video.creator.displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {video.creator.displayName}
                </span>
                {video.creator.isVerified && (
                  <Verified className="w-3 h-3 text-accent" />
                )}
              </Link>
            )}
            <div className="flex items-center space-x-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center space-x-1">
                <Eye className="w-3 h-3" />
                <span>{formatNumber(video.stats.views)}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Heart className="w-3 h-3" />
                <span>{formatNumber(video.stats.likes)}</span>
              </span>
            </div>
          </CardContent>
        </div>
      </Card>
    )
  }

  return (
    <Card 
      className="group overflow-hidden hover:shadow-lg transition-all duration-300 bg-card/50 border-border/50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video">
        <Link href={`/video/${video.id}`}>
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onLoad={() => setImageLoaded(true)}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 bg-secondary animate-pulse" />
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Duration */}
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-sm px-2 py-1 rounded">
            {formatDuration(video.duration)}
          </div>

          {/* Category Badge */}
          <div className="absolute top-2 left-2">
            <Badge className={getCategoryColor(video.category)}>
              {video.category.replace('_', ' ')}
            </Badge>
          </div>

          {/* Featured Badge */}
          {video.isFeatured && (
            <div className="absolute top-2 right-2">
              <Badge variant="accent">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            </div>
          )}
        </Link>
      </div>

      <CardContent className="p-4">
        {/* Title */}
        <Link href={`/video/${video.id}`}>
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-accent transition-colors mb-2">
            {video.title}
          </h3>
        </Link>

        {/* Creator Info */}
        {showCreator && (
          <Link href={`/creator/${video.creator.username}`} className="flex items-center space-x-3 mb-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={video.creator.avatar} />
              <AvatarFallback className="text-sm">
                {getUserInitials(video.creator.displayName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium hover:text-accent transition-colors">
                  {video.creator.displayName}
                </span>
                {video.creator.isVerified && (
                  <Verified className="w-4 h-4 text-accent" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                @{video.creator.username}
              </span>
            </div>
          </Link>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{formatNumber(video.stats.views)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Heart className="w-4 h-4" />
              <span>{formatNumber(video.stats.likes)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{formatRelativeTime(video.createdAt)}</span>
            </span>
          </div>
        </div>

        {/* AI Model */}
        <div className="mb-3">
          <Badge variant="outline" className="text-xs">
            {video.aiModel}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {/* Pricing */}
        {video.pricing.isAvailableForSale && (
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Starting from</span>
              <span className="font-semibold text-accent">
                {formatPrice(Math.min(
                  video.pricing.personalLicense || Infinity,
                  video.pricing.commercialLicense || Infinity,
                  video.pricing.extendedLicense || Infinity
                ))}
              </span>
            </div>
            
            {isHovered && (
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  <Heart className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="gradient">
                  <Download className="w-4 h-4 mr-2" />
                  Buy
                </Button>
              </div>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}