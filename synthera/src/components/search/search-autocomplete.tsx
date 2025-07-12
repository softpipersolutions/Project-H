'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { 
  Search,
  Video,
  User,
  Hash,
  Tag,
  Palette,
  TrendingUp,
  Clock,
  Play,
  Users,
  Star,
  Loader2
} from 'lucide-react'
import { formatNumber } from '@/lib/utils'

interface Suggestion {
  type: 'video' | 'creator' | 'tag' | 'category' | 'style'
  value: string
  label: string
  id?: string
  thumbnail?: string
  avatar?: string
  creator?: string
  username?: string
  followers?: number
  videos?: number
  views?: number
  count?: number
  verified?: boolean
  category?: string
  style?: string
}

interface SearchAutocompleteProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onSelect?: (suggestion: Suggestion) => void
  className?: string
}

export function SearchAutocomplete({
  placeholder = "Search videos, creators, or tags...",
  value,
  onChange,
  onSelect,
  className
}: SearchAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch suggestions
  const { data: suggestionsData, isLoading } = useQuery({
    queryKey: ['search-suggestions', value],
    queryFn: async () => {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(value)}`)
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions')
      }
      return response.json()
    },
    enabled: value.length >= 2 || value.length === 0,
    staleTime: 30000, // Cache for 30 seconds
  })

  const suggestions: Suggestion[] = suggestionsData?.suggestions || []

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleSelect = (suggestion: Suggestion) => {
    onChange(suggestion.value)
    setIsOpen(false)
    setSelectedIndex(-1)
    onSelect?.(suggestion)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setIsOpen(true)
    setSelectedIndex(-1)
  }

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  const getSuggestionIcon = (suggestion: Suggestion) => {
    switch (suggestion.type) {
      case 'video':
        return <Video className="w-4 h-4 text-blue-500" />
      case 'creator':
        return <User className="w-4 h-4 text-green-500" />
      case 'tag':
        return <Hash className="w-4 h-4 text-purple-500" />
      case 'category':
        return <Tag className="w-4 h-4 text-orange-500" />
      case 'style':
        return <Palette className="w-4 h-4 text-pink-500" />
      default:
        return <Search className="w-4 h-4 text-muted-foreground" />
    }
  }

  const renderSuggestion = (suggestion: Suggestion, index: number) => {
    const isSelected = index === selectedIndex

    return (
      <div
        key={`${suggestion.type}-${suggestion.value}-${index}`}
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
          isSelected ? 'bg-muted' : 'hover:bg-muted/50'
        }`}
        onClick={() => handleSelect(suggestion)}
      >
        {suggestion.type === 'video' && suggestion.thumbnail ? (
          <img 
            src={suggestion.thumbnail} 
            alt={suggestion.label}
            className="w-12 h-8 object-cover rounded"
          />
        ) : suggestion.type === 'creator' && suggestion.avatar ? (
          <img 
            src={suggestion.avatar} 
            alt={suggestion.label}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            {getSuggestionIcon(suggestion)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{suggestion.label}</span>
            {suggestion.verified && (
              <Star className="w-4 h-4 text-blue-500" />
            )}
          </div>
          
          {suggestion.type === 'video' && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>by {suggestion.creator}</span>
              <span className="flex items-center gap-1">
                <Play className="w-3 h-3" />
                {formatNumber(suggestion.views || 0)} views
              </span>
            </div>
          )}
          
          {suggestion.type === 'creator' && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {formatNumber(suggestion.followers || 0)} followers
              </span>
              <span className="flex items-center gap-1">
                <Video className="w-3 h-3" />
                {formatNumber(suggestion.videos || 0)} videos
              </span>
            </div>
          )}
          
          {suggestion.type === 'tag' && suggestion.count && (
            <div className="text-xs text-muted-foreground">
              {formatNumber(suggestion.count)} videos
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          {suggestion.type}
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className={`pl-10 ${className}`}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          {suggestions.length > 0 ? (
            <div>
              {value.length === 0 && (
                <div className="px-4 py-2 text-xs font-medium text-muted-foreground border-b">
                  <TrendingUp className="w-4 h-4 inline mr-2" />
                  Popular Searches
                </div>
              )}
              
              {suggestions.map((suggestion, index) => renderSuggestion(suggestion, index))}
            </div>
          ) : value.length >= 2 && !isLoading ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2" />
              <p>No suggestions found</p>
              <p className="text-xs">Try searching for videos, creators, or tags</p>
            </div>
          ) : value.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2" />
              <p>Start typing to see suggestions</p>
              <p className="text-xs">Search for videos, creators, categories, and more</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}