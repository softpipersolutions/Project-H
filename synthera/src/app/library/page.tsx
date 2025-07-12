'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/navigation/navbar'
import { VideoCard } from '@/components/video/video-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { 
  Download,
  Search,
  Filter,
  SortAsc,
  Calendar,
  Heart,
  Video,
  ShoppingCart,
  DollarSign,
  Eye,
  Clock,
  FileText,
  Grid3X3,
  List,
  Loader2,
  AlertCircle,
  Package,
  Star,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { formatNumber, formatPrice, formatRelativeTime } from '@/lib/utils'

interface Purchase {
  id: string
  videoId: string
  licenseType: string
  amount: number
  currency: string
  status: string
  createdAt: string
  video: {
    id: string
    title: string
    thumbnailUrl: string
    duration: number
    category: string
    style: string
    creator: {
      username: string
      displayName: string
      avatar?: string
      isVerified: boolean
    }
  }
}

interface LikedVideo {
  id: string
  videoId: string
  createdAt: string
  video: {
    id: string
    title: string
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
    creator: {
      username: string
      displayName: string
      avatar?: string
      isVerified: boolean
    }
    createdAt: string
  }
}

interface Collection {
  id: string
  name: string
  description: string
  isPublic: boolean
  videoCount: number
  createdAt: string
  updatedAt: string
}

export default function LibraryPage() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState('purchases')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Fetch user's purchases
  const { data: purchasesData, isLoading: purchasesLoading } = useQuery({
    queryKey: ['user-purchases'],
    queryFn: async () => {
      const response = await fetch('/api/library/purchases')
      if (!response.ok) {
        throw new Error('Failed to fetch purchases')
      }
      return response.json()
    },
  })

  // Fetch user's liked videos
  const { data: likesData, isLoading: likesLoading } = useQuery({
    queryKey: ['user-likes'],
    queryFn: async () => {
      const response = await fetch('/api/library/likes')
      if (!response.ok) {
        throw new Error('Failed to fetch likes')
      }
      return response.json()
    },
  })

  // Fetch user's collections
  const { data: collectionsData, isLoading: collectionsLoading } = useQuery({
    queryKey: ['user-collections'],
    queryFn: async () => {
      const response = await fetch('/api/library/collections')
      if (!response.ok) {
        throw new Error('Failed to fetch collections')
      }
      return response.json()
    },
  })

  const purchases: Purchase[] = purchasesData?.purchases || []
  const likes: LikedVideo[] = likesData?.likes || []
  const collections: Collection[] = collectionsData?.collections || []

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Package className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getLicenseColor = (licenseType: string) => {
    switch (licenseType) {
      case 'PERSONAL':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'COMMERCIAL':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'EXTENDED':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      case 'EXCLUSIVE':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const filteredPurchases = purchases.filter(purchase =>
    purchase.video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    purchase.video.creator.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredLikes = likes.filter(like =>
    like.video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    like.video.creator.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isLoading = purchasesLoading || likesLoading || collectionsLoading

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Library</h1>
            <p className="text-muted-foreground">
              Your purchased videos, liked content, and collections
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
            
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Purchases</p>
                  <p className="text-2xl font-bold">{purchases.length}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold">
                    {formatPrice(purchases.reduce((sum, p) => sum + p.amount, 0))}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Liked Videos</p>
                  <p className="text-2xl font-bold">{likes.length}</p>
                </div>
                <Heart className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Collections</p>
                  <p className="text-2xl font-bold">{collections.length}</p>
                </div>
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="purchases">
              Purchases ({purchases.length})
            </TabsTrigger>
            <TabsTrigger value="likes">
              Liked ({likes.length})
            </TabsTrigger>
            <TabsTrigger value="collections">
              Collections ({collections.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purchases" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : filteredPurchases.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredPurchases.map((purchase) => (
                    <div key={purchase.id} className="space-y-3">
                      <VideoCard
                        id={purchase.video.id}
                        title={purchase.video.title}
                        thumbnailUrl={purchase.video.thumbnailUrl}
                        duration={purchase.video.duration}
                        views={0}
                        likes={0}
                        creator={purchase.video.creator}
                        category={purchase.video.category}
                        style={purchase.video.style}
                        isFeatured={false}
                        pricing={{ personalLicense: purchase.amount, isAvailableForSale: false }}
                        createdAt={purchase.createdAt}
                      />
                      <div className="flex items-center justify-between text-xs">
                        <Badge className={getLicenseColor(purchase.licenseType)}>
                          {purchase.licenseType}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(purchase.status)}
                          <span className="text-muted-foreground">
                            {formatPrice(purchase.amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPurchases.map((purchase) => (
                    <Card key={purchase.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={purchase.video.thumbnailUrl}
                            alt={purchase.video.title}
                            className="w-24 h-16 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{purchase.video.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              by {purchase.video.creator.displayName}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getLicenseColor(purchase.licenseType)} variant="outline">
                                {purchase.licenseType}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatRelativeTime(new Date(purchase.createdAt))}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusIcon(purchase.status)}
                              <span className="font-medium">{formatPrice(purchase.amount)}</span>
                            </div>
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4 mr-2" />
                              Download
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
                  <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No purchases yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start exploring and purchasing AI-generated videos to build your library.
                  </p>
                  <Button asChild>
                    <a href="/explore">Browse Videos</a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="likes" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : filteredLikes.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredLikes.map((like) => (
                  <VideoCard
                    key={like.id}
                    id={like.video.id}
                    title={like.video.title}
                    thumbnailUrl={like.video.thumbnailUrl}
                    duration={like.video.duration}
                    views={like.video.views}
                    likes={like.video.likes}
                    creator={like.video.creator}
                    category={like.video.category}
                    style={like.video.style}
                    isFeatured={like.video.isFeatured}
                    pricing={like.video.pricing}
                    createdAt={like.video.createdAt}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No liked videos</h3>
                  <p className="text-muted-foreground mb-4">
                    Heart videos you love to save them here for easy access.
                  </p>
                  <Button asChild>
                    <a href="/explore">Discover Videos</a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="collections" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : collections.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.map((collection) => (
                  <Card key={collection.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{collection.name}</CardTitle>
                        <Badge variant={collection.isPublic ? "default" : "secondary"}>
                          {collection.isPublic ? "Public" : "Private"}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {collection.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{collection.videoCount} videos</span>
                        <span>Updated {formatRelativeTime(new Date(collection.updatedAt))}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No collections yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create collections to organize your favorite videos.
                  </p>
                  <Button>
                    <FileText className="w-4 h-4 mr-2" />
                    Create Collection
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}