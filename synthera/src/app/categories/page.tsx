'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Navbar } from '@/components/navigation/navbar'
import { VideoCard } from '@/components/video/video-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search,
  TrendingUp,
  Eye,
  Video,
  Palette,
  Mountain,
  User,
  Building,
  Sparkles,
  Globe,
  Rocket,
  Trees,
  Camera,
  Loader2,
  ChevronRight,
  Star,
  Play
} from 'lucide-react'
import { formatNumber, formatPrice } from '@/lib/utils'

interface Category {
  id: string
  name: string
  displayName: string
  description: string
  icon: React.ReactNode
  count: number
  trending: boolean
  color: string
  featuredVideo?: {
    id: string
    title: string
    thumbnailUrl: string
    creator: {
      displayName: string
      isVerified: boolean
    }
  }
}

const categoryData: Category[] = [
  {
    id: 'AI_ART',
    name: 'AI_ART',
    displayName: 'AI Art',
    description: 'Digital artwork created with artificial intelligence',
    icon: <Palette className="w-6 h-6" />,
    count: 1250,
    trending: true,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'ANIMATION',
    name: 'ANIMATION',
    displayName: 'Animation',
    description: 'Moving sequences and animated content',
    icon: <Play className="w-6 h-6" />,
    count: 890,
    trending: true,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'ARCHITECTURE',
    name: 'ARCHITECTURE',
    displayName: 'Architecture',
    description: 'Building designs and architectural visualizations',
    icon: <Building className="w-6 h-6" />,
    count: 650,
    trending: false,
    color: 'from-gray-500 to-slate-600'
  },
  {
    id: 'CHARACTERS',
    name: 'CHARACTERS',
    displayName: 'Characters',
    description: 'Human and creature character designs',
    icon: <User className="w-6 h-6" />,
    count: 980,
    trending: true,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'LANDSCAPES',
    name: 'LANDSCAPES',
    displayName: 'Landscapes',
    description: 'Natural and scenic environments',
    icon: <Mountain className="w-6 h-6" />,
    count: 720,
    trending: false,
    color: 'from-green-600 to-teal-600'
  },
  {
    id: 'ABSTRACT',
    name: 'ABSTRACT',
    displayName: 'Abstract',
    description: 'Non-representational and conceptual art',
    icon: <Sparkles className="w-6 h-6" />,
    count: 540,
    trending: false,
    color: 'from-violet-500 to-purple-600'
  },
  {
    id: 'PORTRAITS',
    name: 'PORTRAITS',
    displayName: 'Portraits',
    description: 'Face and portrait studies',
    icon: <Camera className="w-6 h-6" />,
    count: 430,
    trending: false,
    color: 'from-rose-500 to-pink-600'
  },
  {
    id: 'FANTASY',
    name: 'FANTASY',
    displayName: 'Fantasy',
    description: 'Magical and fantastical worlds',
    icon: <Star className="w-6 h-6" />,
    count: 670,
    trending: true,
    color: 'from-amber-500 to-orange-500'
  },
  {
    id: 'SCI_FI',
    name: 'SCI_FI',
    displayName: 'Sci-Fi',
    description: 'Futuristic and science fiction themes',
    icon: <Rocket className="w-6 h-6" />,
    count: 580,
    trending: true,
    color: 'from-indigo-500 to-blue-600'
  },
  {
    id: 'NATURE',
    name: 'NATURE',
    displayName: 'Nature',
    description: 'Flora, fauna, and natural elements',
    icon: <Trees className="w-6 h-6" />,
    count: 390,
    trending: false,
    color: 'from-lime-500 to-green-600'
  },
  {
    id: 'URBAN',
    name: 'URBAN',
    displayName: 'Urban',
    description: 'City scenes and urban environments',
    icon: <Globe className="w-6 h-6" />,
    count: 320,
    trending: false,
    color: 'from-slate-500 to-gray-600'
  }
]

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  
  // Get category stats
  const { data: categoryStats, isLoading } = useQuery({
    queryKey: ['category-stats'],
    queryFn: async () => {
      const response = await fetch('/api/categories/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch category stats')
      }
      return response.json()
    },
  })

  // Get featured videos by category
  const { data: featuredData } = useQuery({
    queryKey: ['featured-by-category'],
    queryFn: async () => {
      const response = await fetch('/api/categories/featured')
      if (!response.ok) {
        throw new Error('Failed to fetch featured videos')
      }
      return response.json()
    },
  })

  const stats = categoryStats?.categories || {}
  const featured = featuredData?.categories || {}

  // Merge real data with category data
  const enrichedCategories = categoryData.map(category => ({
    ...category,
    count: stats[category.name]?.count || category.count,
    featuredVideo: featured[category.name]?.[0] || category.featuredVideo
  }))

  const filteredCategories = enrichedCategories.filter(category =>
    category.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const trendingCategories = filteredCategories.filter(cat => cat.trending)
  const allCategories = filteredCategories.sort((a, b) => b.count - a.count)

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Explore by{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Category
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover AI-generated videos organized by style, theme, and content type
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats Overview */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
              <CardContent className="p-6 text-center">
                <Video className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-3xl font-bold">
                  {formatNumber(Object.values(stats).reduce((sum: number, cat: any) => sum + (cat?.count || 0), 0))}
                </div>
                <div className="text-sm text-muted-foreground">Total Videos</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-green-500/10 to-teal-500/10 border-green-500/20">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-3xl font-bold">{trendingCategories.length}</div>
                <div className="text-sm text-muted-foreground">Trending Categories</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20">
              <CardContent className="p-6 text-center">
                <Eye className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <div className="text-3xl font-bold">
                  {formatNumber(Object.values(stats).reduce((sum: number, cat: any) => sum + (cat?.views || 0), 0))}
                </div>
                <div className="text-sm text-muted-foreground">Total Views</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trending Categories */}
        {trendingCategories.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <h2 className="text-2xl font-bold">Trending Categories</h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingCategories.slice(0, 6).map((category) => (
                <Card 
                  key={category.id} 
                  className="group hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => window.location.href = `/explore?category=${category.displayName}`}
                >
                  <div className={`h-2 bg-gradient-to-r ${category.color}`} />
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${category.color} text-white`}>
                          {category.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {category.displayName}
                          </h3>
                          <Badge variant="secondary" className="mt-1">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Trending
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    
                    <p className="text-muted-foreground text-sm mb-4">
                      {category.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {formatNumber(category.count)} videos
                      </span>
                      {category.featuredVideo && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <img 
                            src={category.featuredVideo.thumbnailUrl} 
                            alt={category.featuredVideo.title}
                            className="w-8 h-6 object-cover rounded"
                          />
                          <span>Latest</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Categories */}
        <div>
          <h2 className="text-2xl font-bold mb-6">All Categories</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allCategories.map((category) => (
                <Card 
                  key={category.id} 
                  className="group hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => window.location.href = `/explore?category=${category.displayName}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${category.color} text-white`}>
                        {category.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold group-hover:text-primary transition-colors">
                            {category.displayName}
                          </h3>
                          {category.trending && (
                            <Badge variant="secondary" className="text-xs">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Hot
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(category.count)} videos
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    
                    <p className="text-muted-foreground text-sm mb-4">
                      {category.description}
                    </p>
                    
                    {category.featuredVideo && (
                      <div className="border-t pt-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={category.featuredVideo.thumbnailUrl} 
                            alt={category.featuredVideo.title}
                            className="w-12 h-8 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {category.featuredVideo.title}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <span>by {category.featuredVideo.creator.displayName}</span>
                              {category.featuredVideo.creator.isVerified && (
                                <Star className="w-3 h-3 text-blue-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}