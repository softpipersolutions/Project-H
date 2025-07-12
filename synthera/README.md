# Synthera - AI Video Platform

Synthera is a premium platform for AI-generated video content where creators can monetize their synthetic media creations. This platform combines the sleek design of Netflix, the creative showcase of Behance, and the creator economy model of OnlyFans.

## Features

- 🎨 **Premium AI Video Gallery** - Curated collection of high-quality AI-generated videos
- 💰 **Creator Monetization** - Multiple revenue streams including direct sales, licensing, and subscriptions
- 🔐 **OAuth Authentication** - Secure login with Google, GitHub, and Discord
- 🎭 **User Types** - Creators, Collectors, and Browsers with different access levels
- 💳 **Stripe Integration** - Secure payment processing for purchases and subscriptions
- 🏷️ **Advanced Categorization** - Videos organized by AI model, style, and category
- 🔍 **Smart Search** - Advanced filtering and discovery features
- 📊 **Analytics Dashboard** - Detailed insights for creators
- 🌙 **Dark Theme** - Premium dark design with electric blue and cyan accents

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS v4
- **Authentication**: NextAuth.js with OAuth providers
- **Database**: PostgreSQL with Prisma ORM
- **Payments**: Stripe
- **State Management**: Zustand
- **UI Components**: Radix UI primitives
- **Data Fetching**: TanStack Query
- **Animations**: Framer Motion (ready to implement)

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Stripe account
- OAuth app credentials (Google, GitHub, Discord)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/synthera.git
   cd synthera
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.local` and fill in your values:
   ```bash
   cp .env.local .env.local
   ```

   Required environment variables:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/synthera"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   
   # OAuth Providers
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   GITHUB_CLIENT_ID="your-github-client-id"
   GITHUB_CLIENT_SECRET="your-github-client-secret"
   DISCORD_CLIENT_ID="your-discord-client-id"
   DISCORD_CLIENT_SECRET="your-discord-client-secret"
   
   # Stripe
   STRIPE_SECRET_KEY="your-stripe-secret-key"
   STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
   STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push database schema
   npm run db:push
   
   # Optional: Open Prisma Studio
   npm run db:studio
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and apply migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data

## Project Structure

```
synthera/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js app router
│   │   ├── api/              # API routes
│   │   ├── auth/             # Authentication pages
│   │   ├── dashboard/        # Creator dashboard
│   │   └── upload/           # Video upload
│   ├── components/           # React components
│   │   ├── ui/              # Reusable UI components
│   │   ├── navigation/      # Navigation components
│   │   └── video/           # Video-related components
│   ├── lib/                  # Utility functions
│   │   ├── auth.ts          # NextAuth configuration
│   │   ├── db.ts            # Database queries
│   │   ├── prisma.ts        # Prisma client
│   │   └── utils.ts         # Helper functions
│   ├── store/               # Zustand stores
│   ├── types/               # TypeScript definitions
│   └── hooks/               # Custom React hooks
```

## Database Schema

The application uses a comprehensive PostgreSQL schema with the following main entities:

- **Users** - User accounts with different types (Creator, Collector, Browser)
- **Videos** - AI-generated video content with metadata and pricing
- **Creators** - Extended creator profiles with analytics
- **Purchases** - Video purchase transactions
- **Subscriptions** - User subscription management
- **Collections** - Curated video collections
- **Comments** - Video comments and replies
- **Likes** - Video likes/favorites

## Authentication

Authentication is handled by NextAuth.js with support for:

- Google OAuth
- GitHub OAuth  
- Discord OAuth
- Automatic user creation on first sign-in
- Session management with database storage

## Development

### Building

```bash
npm run build
```

### Linting

```bash
npm run lint
```

### Type Checking

The project uses TypeScript with strict type checking. All components and utilities are fully typed.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Roadmap

### Phase 1: MVP ✅
- [x] Project setup and authentication
- [x] Database schema and basic UI
- [x] Landing page and core components

### Phase 2: Core Features (In Progress)
- [ ] Video upload and processing
- [ ] Payment integration
- [ ] User profiles and dashboards
- [ ] Search and discovery

### Phase 3: Advanced Features
- [ ] AI video generation tools
- [ ] Creator collaboration features
- [ ] Advanced analytics
- [ ] Mobile app