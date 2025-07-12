import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Sparkles, Zap, Trophy, Shield, Rocket } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Synthera</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/discover" className="text-muted-foreground hover:text-foreground transition-colors">
              Discover
            </Link>
            <Link href="/creators" className="text-muted-foreground hover:text-foreground transition-colors">
              Creators
            </Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="gradient">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 bg-secondary/50 px-4 py-2 rounded-full text-sm text-muted-foreground">
            <Zap className="w-4 h-4" />
            <span>Premium AI Video Platform</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            The Future of
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {" "}Digital Artistry
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover, create, and monetize premium AI-generated video content. 
            Join the exclusive community where synthetic media meets artistic excellence.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link href="/auth/signup">
              <Button size="xl" variant="gradient" className="w-full sm:w-auto">
                <Play className="w-5 h-5 mr-2" />
                Start Creating
              </Button>
            </Link>
            <Link href="/discover">
              <Button size="xl" variant="outline" className="w-full sm:w-auto">
                Explore Gallery
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Synthera?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience the premium platform designed exclusively for AI video creators and collectors.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-card/50 border-border/50 hover:bg-card/80 transition-colors">
            <CardHeader>
              <Trophy className="w-10 h-10 text-accent mb-2" />
              <CardTitle>Premium Quality</CardTitle>
              <CardDescription>
                Curated collection of high-quality AI videos from verified creators
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="bg-card/50 border-border/50 hover:bg-card/80 transition-colors">
            <CardHeader>
              <Zap className="w-10 h-10 text-accent mb-2" />
              <CardTitle>Creator Economy</CardTitle>
              <CardDescription>
                Multiple monetization streams with fair revenue sharing for creators
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="bg-card/50 border-border/50 hover:bg-card/80 transition-colors">
            <CardHeader>
              <Shield className="w-10 h-10 text-accent mb-2" />
              <CardTitle>Verified Content</CardTitle>
              <CardDescription>
                Blockchain verification ensures authentic AI-generated content
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="bg-card/50 border-border/50 hover:bg-card/80 transition-colors">
            <CardHeader>
              <Rocket className="w-10 h-10 text-accent mb-2" />
              <CardTitle>Advanced Tools</CardTitle>
              <CardDescription>
                In-platform AI video generation and collaboration features
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="bg-card/50 border-border/50 hover:bg-card/80 transition-colors">
            <CardHeader>
              <Sparkles className="w-10 h-10 text-accent mb-2" />
              <CardTitle>Exclusive Access</CardTitle>
              <CardDescription>
                Premium tier content and early access to cutting-edge AI models
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="bg-card/50 border-border/50 hover:bg-card/80 transition-colors">
            <CardHeader>
              <Play className="w-10 h-10 text-accent mb-2" />
              <CardTitle>Seamless Experience</CardTitle>
              <CardDescription>
                Optimized streaming and instant purchasing with saved preferences
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Join the Future?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Whether you&apos;re a creator looking to monetize your AI videos or a collector 
              seeking premium digital content, Synthera is your gateway to the new creative economy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="xl" variant="gradient">
                  Start Your Journey
                </Button>
              </Link>
              <Link href="/learn-more">
                <Button size="xl" variant="outline">
                  Learn More
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Synthera</span>
              </div>
              <p className="text-muted-foreground">
                The premium platform for AI-generated video content.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <div className="space-y-2 text-muted-foreground">
                <Link href="/discover" className="block hover:text-foreground transition-colors">Discover</Link>
                <Link href="/upload" className="block hover:text-foreground transition-colors">Upload</Link>
                <Link href="/pricing" className="block hover:text-foreground transition-colors">Pricing</Link>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Community</h3>
              <div className="space-y-2 text-muted-foreground">
                <Link href="/creators" className="block hover:text-foreground transition-colors">Creators</Link>
                <Link href="/blog" className="block hover:text-foreground transition-colors">Blog</Link>
                <Link href="/support" className="block hover:text-foreground transition-colors">Support</Link>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <div className="space-y-2 text-muted-foreground">
                <Link href="/privacy" className="block hover:text-foreground transition-colors">Privacy</Link>
                <Link href="/terms" className="block hover:text-foreground transition-colors">Terms</Link>
                <Link href="/licenses" className="block hover:text-foreground transition-colors">Licenses</Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border/40 mt-12 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 Synthera. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
