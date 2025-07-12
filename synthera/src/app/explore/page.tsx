'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/navigation/navbar'
import { VideoCard } from '@/components/video/video-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search,
  Filter,
  SortAsc,
  Grid3X3,
  List,
  TrendingUp,
  Flame,
  Star,
  Clock,
  Eye,
  Heart,
  DollarSign,
  Users,
  Zap,
  Sparkles,
  Award,
  Target,
  Loader2,
  ChevronDown,
  X,
  Play,
  Crown,
  Calendar
} from 'lucide-react'
import { formatNumber, formatPrice, formatRelativeTime } from '@/lib/utils'

interface SearchFilters {
  query: string
  category: string
  style: string
  priceRange: string
  duration: string
  sortBy: string
  dateRange: string
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
  tags: string[]
  isFeatured: boolean
  isPublic: boolean
  pricing: {
    personalLicense?: number
    commercialLicense?: number
    extendedLicense?: number
    exclusiveRights?: number
    isAvailableForSale: boolean
  }
  creator: {
    username: string
    displayName: string
    avatar?: string
    isVerified: boolean
  }
  createdAt: string
}

interface Creator {
  id: string
  username: string
  displayName: string
  avatar?: string
  isVerified: boolean
  followers: number
  totalVideos: number
  totalViews: number
  specialties: string[]
}

const categories = [
  'All Categories',
  'AI Art',
  'Animation',
  'Architecture',
  'Characters',
  'Landscapes',
  'Abstract',
  'Portraits',
  'Fantasy',
  'Sci-Fi',
  'Nature',
  'Urban'
]

const styles = [
  'All Styles',
  'Photorealistic',
  'Cinematic',
  'Artistic',
  'Minimalist',
  'Vintage',
  'Futuristic',
  'Cartoon',
  'Oil Painting',
  'Watercolor',
  'Digital Art',
  'Concept Art'
]

const sortOptions = [
  { value: 'trending', label: 'Trending' },
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'views', label: 'Most Viewed' },
  { value: 'likes', label: 'Most Liked' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' }
]

function ExplorePageContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeTab, setActiveTab] = useState('videos')
  const [showFilters, setShowFilters] = useState(false)
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    category: searchParams.get('category') || 'All Categories',
    style: searchParams.get('style') || 'All Styles',
    priceRange: searchParams.get('price') || 'all',
    duration: searchParams.get('duration') || 'all',
    sortBy: searchParams.get('sort') || 'trending',
    dateRange: searchParams.get('date') || 'all'
  })

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.query) params.set('q', filters.query)
    if (filters.category !== 'All Categories') params.set('category', filters.category)
    if (filters.style !== 'All Styles') params.set('style', filters.style)
    if (filters.priceRange !== 'all') params.set('price', filters.priceRange)
    if (filters.duration !== 'all') params.set('duration', filters.duration)
    if (filters.sortBy !== 'trending') params.set('sort', filters.sortBy)
    if (filters.dateRange !== 'all') params.set('date', filters.dateRange)
    
    const newUrl = params.toString() ? `/explore?${params.toString()}` : '/explore'
    window.history.replaceState({}, '', newUrl)
  }, [filters])

  // Search videos
  const { data: videosData, isLoading: videosLoading } = useQuery({
    queryKey: ['explore-videos', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== 'All Categories' && value !== 'All Styles') {
          params.set(key, value)
        }
      })
      
      const response = await fetch(`/api/search/videos?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch videos')
      }
      return response.json()
    },
  })

  // Search creators
  const { data: creatorsData, isLoading: creatorsLoading } = useQuery({
    queryKey: ['explore-creators', filters.query],
    queryFn: async () => {
      if (!filters.query) return { creators: [] }
      
      const response = await fetch(`/api/search/creators?q=${encodeURIComponent(filters.query)}`)
      if (!response.ok) {
        throw new Error('Failed to fetch creators')
      }
      return response.json()
    },
    enabled: activeTab === 'creators'
  })

  // Trending data
  const { data: trendingData } = useQuery({
    queryKey: ['trending'],
    queryFn: async () => {
      const response = await fetch('/api/trending')
      if (!response.ok) {
        throw new Error('Failed to fetch trending data')
      }
      return response.json()
    },
  })

  const videos: Video[] = videosData?.videos || []
  const creators: Creator[] = creatorsData?.creators || []
  const trending = trendingData?.trending || {}

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      query: '',
      category: 'All Categories',
      style: 'All Styles',
      priceRange: 'all',
      duration: 'all',
      sortBy: 'trending',
      dateRange: 'all'
    })
  }

  const hasActiveFilters = () => {
    return filters.category !== 'All Categories' ||
           filters.style !== 'All Styles' ||
           filters.priceRange !== 'all' ||
           filters.duration !== 'all' ||
           filters.dateRange !== 'all'
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Explore</h1>
              <p className="text-muted-foreground">
                Discover amazing AI-generated videos from talented creators
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search videos, creators, or tags..."
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters() && (
                <Badge variant="secondary" className="ml-2">
                  {Object.values(filters).filter(v => v && v !== 'all' && v !== 'All Categories' && v !== 'All Styles').length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Filters</CardTitle>
                  {hasActiveFilters() && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Category Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <select
                      value={filters.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="w-full p-2 border rounded-md bg-background"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  {/* Style Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Style</label>
                    <select
                      value={filters.style}
                      onChange={(e) => handleFilterChange('style', e.target.value)}
                      className="w-full p-2 border rounded-md bg-background"
                    >
                      {styles.map(style => (
                        <option key={style} value={style}>{style}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price Range</label>
                    <select
                      value={filters.priceRange}
                      onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                      className="w-full p-2 border rounded-md bg-background"
                    >
                      <option value="all">All Prices</option>
                      <option value="free">Free</option>
                      <option value="under_10">Under $10</option>
                      <option value="10_50">$10 - $50</option>
                      <option value="50_100">$50 - $100</option>
                      <option value="over_100">Over $100</option>
                    </select>
                  </div>

                  {/* Duration Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duration</label>
                    <select
                      value={filters.duration}
                      onChange={(e) => handleFilterChange('duration', e.target.value)}
                      className="w-full p-2 border rounded-md bg-background"
                    >
                      <option value="all">Any Duration</option>
                      <option value="short">Under 30s</option>
                      <option value="medium">30s - 2min</option>
                      <option value="long">Over 2min</option>
                    </select>
                  </div>
                </div>

                {/* Date Range */}
                <div className="flex gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Upload Date</label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                      className="p-2 border rounded-md bg-background"
                    >
                      <option value="all">Any Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="year">This Year</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sort By</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      className="p-2 border rounded-md bg-background"
                    >
                      {sortOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Trending Section */}
        {!filters.query && trending && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-bold">Trending Now</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="font-medium">Hot Right Now</span>
                  </div>
                  <p className="text-2xl font-bold">{trending.hotVideos || 0}</p>
                  <p className="text-sm text-muted-foreground">videos gaining traction</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-blue-500" />
                    <span className="font-medium">Top Category</span>
                  </div>
                  <p className="text-lg font-bold">{trending.topCategory || 'AI Art'}</p>
                  <p className="text-sm text-muted-foreground">most popular this week</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-green-500/10 to-teal-500/10 border-green-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Rising Creator</span>
                  </div>
                  <p className="text-lg font-bold">{trending.risingCreator || '@artigen'}</p>
                  <p className="text-sm text-muted-foreground">+{trending.growth || 150}% growth</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="videos">
                Videos ({formatNumber(videos.length)})
              </TabsTrigger>
              <TabsTrigger value="creators">
                Creators ({formatNumber(creators.length)})
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Updated just now</span>
            </div>
          </div>

          <TabsContent value="videos" className="space-y-6">
            {videosLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : videos.length > 0 ? (
              viewMode === 'grid' ? (
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
                      creator={video.creator}
                      category={video.category}
                      style={video.style}
                      isFeatured={video.isFeatured}
                      pricing={video.pricing}
                      createdAt={video.createdAt}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {videos.map((video) => (
                    <Card key={video.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="w-32 h-20 object-cover rounded"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Play className="w-8 h-8 text-white/80" />
                            </div>
                            {video.isFeatured && (
                              <Badge className="absolute top-1 right-1" variant="accent">
                                <Star className="w-3 h-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-1 truncate">{video.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {video.description}
                            </p>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                {formatNumber(video.views)} views
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="w-4 h-4" />
                                {formatNumber(video.likes)} likes
                              </span>
                              <span>{formatRelativeTime(new Date(video.createdAt))}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{video.category}</Badge>
                              <Badge variant="secondary">{video.style}</Badge>
                              {video.pricing.isAvailableForSale && (
                                <Badge variant="outline">
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  From {formatPrice(video.pricing.personalLicense || 0)}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-2">
                              <img
                                src={video.creator.avatar || '/default-avatar.png'}
                                alt={video.creator.displayName}
                                className="w-8 h-8 rounded-full"
                              />
                              <div>
                                <p className="text-sm font-medium">{video.creator.displayName}</p>
                                {video.creator.isVerified && (
                                  <Badge variant="accent" className="text-xs">
                                    <Star className="w-3 h-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <Button size="sm" asChild>
                              <a href={`/video/${video.id}`}>View Details</a>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No videos found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search terms or filters to find what you're looking for.
                  </p>
                  <Button onClick={clearFilters}>Clear Filters</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="creators" className="space-y-6">
            {creatorsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : creators.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {creators.map((creator) => (
                  <Card key={creator.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <img
                        src={creator.avatar || '/default-avatar.png'}
                        alt={creator.displayName}
                        className="w-16 h-16 rounded-full mx-auto mb-4"
                      />
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <h3 className="font-semibold">{creator.displayName}</h3>
                          {creator.isVerified && (
                            <Badge variant="accent" className="text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-muted-foreground">@{creator.username}</p>
                        
                        <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {formatNumber(creator.followers)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Play className="w-4 h-4" />
                            {formatNumber(creator.totalVideos)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {formatNumber(creator.totalViews)}
                          </span>
                        </div>
                        
                        {creator.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {creator.specialties.slice(0, 3).map((specialty, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="pt-2">
                          <Button size="sm" className="w-full" asChild>
                            <a href={`/profile/${creator.username}`}>View Profile</a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No creators found</h3>
                  <p className="text-muted-foreground">
                    Try searching for different terms to find creators.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExplorePageContent />
    </Suspense>
  )
}