# Narrativ 📝

A modern, full-stack blogging platform built with Next.js, Better Auth, and Drizzle ORM. Create, manage, and share your stories with a beautiful, responsive interface.

## ✨ Features

- **🔐 Authentication** - Secure email/password and Google OAuth login
- **📝 Rich Editor** - Markdown-based content creation with live preview
- **📊 Analytics Dashboard** - Track views, likes, and engagement
- **🎨 Beautiful UI** - Modern design with Tailwind CSS and shadcn/ui
- **📱 Responsive** - Mobile-first design that works everywhere
- **⚡ Fast** - Built with Next.js 15 and optimized for performance
- **🔒 Secure** - Type-safe with TypeScript and secure authentication

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Authentication**: Better Auth with email/password and Google OAuth
- **Database**: PostgreSQL with Drizzle ORM hos on NeonDB
- **Deployment**: Vercel
- **Package Manager**: Bun

## 📁 Project Structure

```
narrativ/
├── apps/
│   └── web/                    # Main Next.js application
│       ├── app/               # Next.js app router
│       │   ├── api/          # API routes
│       │   ├── dashboard/    # Dashboard pages
│       │   ├── login/        # Authentication pages
│       │   └── new-post/     # Post creation
│       ├── components/       # Reusable UI components
│       ├── lib/             # Utilities and configuration
│       │   ├── auth.ts      # Better Auth configuration
│       │   ├── auth-client.ts # Client-side auth
│       │   └── db/          # Database configuration
│       └── public/          # Static assets
└── packages/                # Shared packages (if any)
```

## 🛠️ Installation

### Prerequisites

- [Bun](https://bun.sh/) (v1.0+)
- [Node.js](https://nodejs.org/) (v18+)
- PostgreSQL database

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/narrativ.git
cd narrativ
```

### 2. Install dependencies

```bash
bun install
```

### 3. Set up environment variables

Create a `.env` file in the `apps/web` directory:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/narrativ

# Authentication
BETTER_AUTH_SECRET=your-random-secret-key-here

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Production URL (for deployment)
NEXTAUTH_URL=https://your-app.vercel.app
```

### 4. Set up the database

```bash
cd apps/server

# Generate database schema
bun run db:generate

# Push schema to database
bun run db:push
```

### 5. Start the development server

```bash
bun dev
```

Visit [http://localhost:3001](http://localhost:3001) to see the application.

## 📚 Usage

### Creating Your First Post

1. **Sign up** or **Sign in** to your account
2. Navigate to the **Dashboard**
3. Click **"New Post"**
4. Write your content using the markdown editor
5. Add a category and publish your post

### Managing Posts

- **Dashboard** - View all your posts, analytics, and activity
- **Edit Posts** - Click the edit icon on any post
- **Categories** - Organize posts with custom categories
- **Analytics** - Track views, likes, and engagement

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables

3. **Environment Variables on Vercel**:
   ```bash
   DATABASE_URL=your-production-database-url
   BETTER_AUTH_SECRET=your-production-secret
   NEXTAUTH_URL=https://your-app.vercel.app
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Deploy**:
   - Vercel will automatically build and deploy your app
   - Your app will be live at `https://your-app.vercel.app`

### Database Setup for Production

1. **Create a PostgreSQL database** (recommended: [Neon](https://neon.tech/), [Supabase](https://supabase.com/), or [Railway](https://railway.app/))

2. **Run migrations**:
   ```bash
   bun run db:push
   ```

## 🔧 Development

### Available Scripts

```bash
# Development
bun dev                 # Start development server
bun build              # Build for production
bun start              # Start production server

# Database
bun run db:generate    # Generate database migrations
bun run db:push        # Push schema to database
bun run db:studio      # Open Drizzle Studio
bun run db:migrate     # Run migrations

# Linting
bun lint               # Run ESLint
```

### Project Architecture

- **Monorepo Structure** - Organized with apps and packages
- **API Routes** - RESTful API built with Next.js API routes
- **Database** - PostgreSQL with Drizzle ORM for type safety
- **Authentication** - Better Auth for secure, modern auth
- **State Management** - React hooks and server state
- **Styling** - Tailwind CSS with custom design system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Better Auth](https://better-auth.com/) - Modern authentication
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe database toolkit
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Lucide](https://lucide.dev/) - Beautiful icons



**Happy writing! ✨**
