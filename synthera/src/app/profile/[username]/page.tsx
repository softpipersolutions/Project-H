'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Navbar } from '@/components/navigation/navbar'
import { VideoCard } from '@/components/video/video-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MapPin, 
  Calendar, 
  Globe, 
  Twitter, 
  Instagram, 
  Youtube, 
  Link as LinkIcon,
  Users,
  Heart,
  Eye,
  DollarSign,
  Video,
  Settings,
  Share2,
  UserPlus,
  UserMinus,
  Loader2,
  AlertCircle,
  Star,
  Trophy,
  TrendingUp
} from 'lucide-react'
import { formatNumber, formatPrice, formatRelativeTime } from '@/lib/utils'

interface UserProfile {
  id: string
  username: string
  displayName: string
  email: string
  avatar?: string
  bio?: string
  location?: string
  website?: string
  socialLinks?: {
    twitter?: string
    instagram?: string
    youtube?: string
  }
  isVerified: boolean
  userType: 'BROWSER' | 'CREATOR' | 'COLLECTOR'
  subscriptionTier?: string
  joinedAt: string
  stats: {
    followers: number
    following: number
    totalViews: number
    totalLikes: number
    totalVideos: number
    totalRevenue: number
  }
  creator?: {
    id: string
    isVerified: boolean
    totalEarnings: number
    totalSales: number
    averageRating: number
    specialties: string[]
  }
}

interface Video {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  duration: number
  views: number
  likes: number
  category: string
  style: string
  isFeatured: boolean
  pricing: {
    personalLicense?: number
    isAvailableForSale: boolean
  }
  createdAt: string
}

export default function ProfilePage() {
  const params = useParams()
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('videos')
  const [isFollowing, setIsFollowing] = useState(false)
  
  const username = params.username as string
  const isOwnProfile = session?.user?.username === username

  const { data: profileData, isLoading, error } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}`)
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      return response.json()
    },
  })

  const { data: videosData } = useQuery({
    queryKey: ['profile-videos', username],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}/videos`)
      if (!response.ok) {
        throw new Error('Failed to fetch videos')
      }
      return response.json()
    },
    enabled: !!username,
  })

  const profile: UserProfile | undefined = profileData?.user
  const videos: Video[] = videosData?.videos || []

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleFollow = async () => {
    if (!session) {
      window.location.href = '/auth/signin'
      return
    }
    
    setIsFollowing(!isFollowing)
    // TODO: Implement follow/unfollow API call
  }

  const getProfileTypeColor = (type: string) => {
    switch (type) {
      case 'CREATOR':
        return 'bg-gradient-to-r from-purple-500 to-pink-500'
      case 'COLLECTOR':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500'
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600'
    }
  }

  const getProfileTypeIcon = (type: string) => {
    switch (type) {
      case 'CREATOR':
        return <Video className="w-4 h-4" />
      case 'COLLECTOR':
        return <Heart className="w-4 h-4" />
      default:
        return <Eye className="w-4 h-4" />
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

  if (error || !profile) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto border-destructive">
            <CardHeader className="text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-2" />
              <CardTitle>Profile Not Found</CardTitle>
              <CardDescription>
                The profile you're looking for doesn't exist or has been removed.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="relative mb-8">
          {/* Cover Image */}
          <div className={`h-48 rounded-lg ${getProfileTypeColor(profile.userType)} relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-black/20" />
            <div className="absolute top-4 right-4">
              <Badge variant="secondary" className="bg-black/20 text-white border-white/20">
                {getProfileTypeIcon(profile.userType)}
                <span className="ml-1">{profile.userType}</span>
              </Badge>
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mt-6">
            <div className="flex items-end gap-4">
              <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback className="text-xl">
                  {getUserInitials(profile.displayName)}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{profile.displayName}</h1>
                  {profile.isVerified && (
                    <Badge variant="accent" className="text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {profile.creator?.isVerified && (
                    <Badge variant="secondary" className="text-xs">
                      <Trophy className="w-3 h-3 mr-1" />
                      Pro Creator
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">@{profile.username}</p>
                {profile.subscriptionTier && profile.subscriptionTier !== 'free' && (
                  <Badge variant="outline" className="text-xs">
                    {profile.subscriptionTier} Member
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              {!isOwnProfile && (
                <>
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    onClick={handleFollow}
                    className="min-w-24"
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4 mr-2" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </>
              )}
              
              {isOwnProfile && (
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Bio and Details */}
          <div className="mt-6 space-y-4">
            {profile.bio && (
              <p className="text-muted-foreground leading-relaxed max-w-2xl">
                {profile.bio}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {formatRelativeTime(new Date(profile.joinedAt))}</span>
              </div>
              
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.location}</span>
                </div>
              )}
              
              {profile.website && (
                <div className="flex items-center gap-1">
                  <LinkIcon className="w-4 h-4" />
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" 
                     className="hover:text-foreground transition-colors">
                    {profile.website.replace('https://', '').replace('http://', '')}
                  </a>
                </div>
              )}
            </div>

            {/* Social Links */}
            {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
              <div className="flex gap-2">
                {profile.socialLinks.twitter && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                      <Twitter className="w-4 h-4" />
                    </a>
                  </Button>
                )}
                {profile.socialLinks.instagram && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={profile.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                      <Instagram className="w-4 h-4" />
                    </a>
                  </Button>
                )}
                {profile.socialLinks.youtube && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={profile.socialLinks.youtube} target="_blank" rel="noopener noreferrer">
                      <Youtube className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="font-bold text-lg">{formatNumber(profile.stats.followers)}</div>
              <div className="text-xs text-muted-foreground">Followers</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="font-bold text-lg">{formatNumber(profile.stats.following)}</div>
              <div className="text-xs text-muted-foreground">Following</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Video className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="font-bold text-lg">{formatNumber(profile.stats.totalVideos)}</div>
              <div className="text-xs text-muted-foreground">Videos</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Eye className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="font-bold text-lg">{formatNumber(profile.stats.totalViews)}</div>
              <div className="text-xs text-muted-foreground">Views</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Heart className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="font-bold text-lg">{formatNumber(profile.stats.totalLikes)}</div>
              <div className="text-xs text-muted-foreground">Likes</div>
            </CardContent>
          </Card>
          
          {profile.creator && (
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="font-bold text-lg">{formatPrice(profile.stats.totalRevenue)}</div>
                <div className="text-xs text-muted-foreground">Revenue</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Creator Specialties */}
        {profile.creator?.specialties && profile.creator.specialties.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Specialties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.creator.specialties.map((specialty, index) => (
                  <Badge key={index} variant="secondary">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="videos">Videos ({videos.length})</TabsTrigger>
            <TabsTrigger value="likes">Liked</TabsTrigger>
            <TabsTrigger value="collections">Collections</TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="space-y-6">
            {videos.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    id={video.id}
                    title={video.title}
                    thumbnailUrl={video.thumbnailUrl}
                    duration={video.duration}
                    views={video.views}
                    likes={video.likes}
                    creator={{
                      username: profile.username,
                      displayName: profile.displayName,
                      avatar: profile.avatar,
                      isVerified: profile.isVerified,
                    }}
                    category={video.category}
                    style={video.style}
                    isFeatured={video.isFeatured}
                    pricing={video.pricing}
                    createdAt={video.createdAt}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No videos yet</h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile 
                      ? "Start creating and sharing your AI-generated videos!"
                      : `${profile.displayName} hasn't shared any videos yet.`
                    }
                  </p>
                  {isOwnProfile && (
                    <Button className="mt-4" asChild>
                      <a href="/upload">Upload Video</a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="likes" className="space-y-6">
            <Card>
              <CardContent className="p-8 text-center">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No liked videos</h3>
                <p className="text-muted-foreground">
                  Videos that {isOwnProfile ? 'you like' : `${profile.displayName} likes`} will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collections" className="space-y-6">
            <Card>
              <CardContent className="p-8 text-center">
                <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No collections</h3>
                <p className="text-muted-foreground">
                  Collections will appear here once created.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}