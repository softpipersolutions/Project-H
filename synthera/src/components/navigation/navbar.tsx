'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { SearchAutocomplete } from '@/components/search/search-autocomplete'
import { 
  Sparkles, 
  Search, 
  Upload, 
  Menu, 
  X, 
  User, 
  Settings, 
  LogOut,
  Crown,
  Zap,
  Library,
  BarChart3
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

export function Navbar() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getSubscriptionIcon = (tier: string) => {
    switch (tier) {
      case 'PRO':
        return <Crown className="w-3 h-3" />
      case 'PREMIUM':
        return <Zap className="w-3 h-3" />
      default:
        return null
    }
  }

  const navItems = [
    { href: '/explore', label: 'Explore' },
    { href: '/categories', label: 'Categories' },
    { href: '/pricing', label: 'Pricing' },
  ]

  const handleSearchSelect = (suggestion: unknown) => {
    if (suggestion.type === 'video' && suggestion.id) {
      router.push(`/video/${suggestion.id}`)
    } else if (suggestion.type === 'creator' && suggestion.username) {
      router.push(`/profile/${suggestion.username}`)
    } else if (suggestion.type === 'category' && suggestion.category) {
      router.push(`/explore?category=${encodeURIComponent(suggestion.category)}`)
    } else if (suggestion.type === 'style' && suggestion.style) {
      router.push(`/explore?style=${encodeURIComponent(suggestion.style)}`)
    } else {
      router.push(`/explore?q=${encodeURIComponent(suggestion.value)}`)
    }
    setSearchQuery('')
  }


  return (
    <nav className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Synthera</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center space-x-2 flex-1 max-w-lg mx-8">
            <SearchAutocomplete
              placeholder="Search videos, creators, tags..."
              value={searchQuery}
              onChange={setSearchQuery}
              onSelect={handleSearchSelect}
              className="w-full"
            />
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            {status === 'loading' ? (
              <div className="w-8 h-8 bg-secondary rounded-full animate-pulse" />
            ) : session ? (
              <>
                {/* Upload Button for Creators */}
                {session.user.userType !== 'BROWSER' && (
                  <Link href="/upload">
                    <Button size="sm" variant="default">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </Link>
                )}

                {/* Mobile Search Button */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="lg:hidden"
                  onClick={() => router.push('/explore')}
                >
                  <Search className="w-4 h-4" />
                </Button>

                {/* User Menu */}
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="flex items-center space-x-2 p-1 rounded-lg hover:bg-secondary/50 transition-colors">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={session.user.image || undefined} />
                        <AvatarFallback className="text-xs">
                          {getUserInitials(session.user.displayName || session.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      {session.user.subscriptionTier !== 'FREE' && (
                        <Badge variant="accent" className="ml-1">
                          {getSubscriptionIcon(session.user.subscriptionTier)}
                          <span className="ml-1 text-xs">
                            {session.user.subscriptionTier}
                          </span>
                        </Badge>
                      )}
                    </button>
                  </DropdownMenu.Trigger>

                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className="min-w-[200px] bg-card border border-border rounded-lg p-2 shadow-lg z-50"
                      sideOffset={8}
                      align="end"
                    >
                      <div className="px-3 py-2 border-b border-border mb-2">
                        <div className="font-medium">{session.user.displayName}</div>
                        <div className="text-sm text-muted-foreground">@{session.user.username}</div>
                      </div>

                      <DropdownMenu.Item asChild>
                        <Link href={`/profile/${session.user.username}`} className="flex items-center px-3 py-2 text-sm hover:bg-secondary rounded cursor-pointer">
                          <User className="w-4 h-4 mr-3" />
                          Profile
                        </Link>
                      </DropdownMenu.Item>

                      <DropdownMenu.Item asChild>
                        <Link href="/library" className="flex items-center px-3 py-2 text-sm hover:bg-secondary rounded cursor-pointer">
                          <Library className="w-4 h-4 mr-3" />
                          My Library
                        </Link>
                      </DropdownMenu.Item>

                      {session.user.userType === 'CREATOR' && (
                        <DropdownMenu.Item asChild>
                          <Link href="/dashboard" className="flex items-center px-3 py-2 text-sm hover:bg-secondary rounded cursor-pointer">
                            <BarChart3 className="w-4 h-4 mr-3" />
                            Dashboard
                          </Link>
                        </DropdownMenu.Item>
                      )}

                      <DropdownMenu.Item asChild>
                        <Link href="/profile/edit" className="flex items-center px-3 py-2 text-sm hover:bg-secondary rounded cursor-pointer">
                          <Settings className="w-4 h-4 mr-3" />
                          Settings
                        </Link>
                      </DropdownMenu.Item>

                      <DropdownMenu.Separator className="h-px bg-border my-2" />

                      <DropdownMenu.Item asChild>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full px-3 py-2 text-sm hover:bg-secondary rounded cursor-pointer text-red-400"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign out
                        </button>
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button variant="default" size="sm">
                    Get Started
                  </Button>
                </Link>
                
                {/* Mobile Search Button for non-authenticated users */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="lg:hidden"
                  onClick={() => router.push('/explore')}
                >
                  <Search className="w-4 h-4" />
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 py-4">
            <div className="space-y-4">
              {/* Mobile Search */}
              <SearchAutocomplete
                placeholder="Search videos, creators..."
                value={searchQuery}
                onChange={setSearchQuery}
                onSelect={(suggestion) => {
                  handleSearchSelect(suggestion)
                  setIsMobileMenuOpen(false)
                }}
                className="w-full"
              />

              {/* Mobile Navigation */}
              <div className="space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}