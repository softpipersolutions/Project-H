export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  type: 'creator' | 'collector' | 'browser';
  subscriptionTier: 'free' | 'premium' | 'pro';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;
  fileSize: number;
  resolution: string;
  creatorId: string;
  creator: User;
  aiModel: string;
  prompts: string[];
  tags: string[];
  category: VideoCategory;
  style: VideoStyle;
  pricing: VideoPricing;
  metadata: VideoMetadata;
  stats: VideoStats;
  isPublic: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoPricing {
  personalLicense: number;
  commercialLicense: number;
  extendedLicense: number;
  exclusiveRights?: number;
  isAvailableForSale: boolean;
  subscriptionTierAccess: ('free' | 'premium' | 'pro')[];
}

export interface VideoMetadata {
  aiModel: string;
  modelVersion?: string;
  generationTime: number;
  prompts: string[];
  negativePrompts?: string[];
  seed?: number;
  guidanceScale?: number;
  steps?: number;
  aspectRatio: string;
  fps: number;
}

export interface VideoStats {
  views: number;
  likes: number;
  purchases: number;
  revenue: number;
  comments: number;
  shares: number;
}

export type VideoCategory = 
  | 'cinematic'
  | 'abstract'
  | 'photorealistic'
  | 'animation'
  | 'motion-graphics'
  | 'experimental'
  | 'nature'
  | 'architecture'
  | 'fashion'
  | 'technology';

export type VideoStyle = 
  | 'cinematic'
  | 'minimalist'
  | 'surreal'
  | 'retro'
  | 'futuristic'
  | 'artistic'
  | 'commercial'
  | 'documentary';

export interface Collection {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  videos: Video[];
  curatorId?: string;
  curator?: User;
  isOfficial: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Purchase {
  id: string;
  userId: string;
  user: User;
  videoId: string;
  video: Video;
  licenseType: 'personal' | 'commercial' | 'extended' | 'exclusive';
  amount: number;
  currency: string;
  stripePaymentId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  user: User;
  tier: 'premium' | 'pro';
  status: 'active' | 'canceled' | 'past_due';
  stripeSubscriptionId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  user: User;
  videoId: string;
  video: Video;
  parentId?: string;
  replies?: Comment[];
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Creator {
  id: string;
  userId: string;
  user: User;
  bio: string;
  website?: string;
  socialLinks: SocialLinks;
  specialties: VideoCategory[];
  isVerified: boolean;
  revenue: CreatorRevenue;
  stats: CreatorStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  youtube?: string;
  website?: string;
  discord?: string;
}

export interface CreatorRevenue {
  totalEarnings: number;
  monthlyEarnings: number;
  pendingPayouts: number;
  lifetimeRevenue: number;
}

export interface CreatorStats {
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalPurchases: number;
  followers: number;
  averageRating: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SearchFilters {
  category?: VideoCategory[];
  style?: VideoStyle[];
  aiModel?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  duration?: {
    min: number;
    max: number;
  };
  resolution?: string[];
  isAvailableForSale?: boolean;
  subscriptionTierAccess?: ('free' | 'premium' | 'pro')[];
}

export interface UploadProgress {
  videoId: string;
  progress: number;
  stage: 'uploading' | 'processing' | 'generating-thumbnail' | 'complete' | 'error';
  error?: string;
}