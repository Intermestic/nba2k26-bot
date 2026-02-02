# HoFSN - Hall of Fame Sports Network

Your premier destination for Hall of Fame Basketball Association News and Highlights.

## 📚 Documentation

- **[Visual Style Guide](./STYLE_GUIDE.md)** - Brand standards, logo usage, color palettes, typography, and design specifications

## 🎨 Brand Assets

### Official League Logo
**Location:** `/client/public/hall-of-champions-logo.png`

**IMPORTANT:** Always use the authentic Hall of Fame Basketball Association logo for all highlight cards and official content. Never use generic or AI-generated alternatives.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Database operations
pnpm db:push  # Push schema changes to database
```

## 📁 Project Structure

```
client/
  public/          # Static assets (logos, images)
  src/
    pages/         # Page components
    components/    # Reusable UI components
    lib/           # Utilities and tRPC client
server/
  routers.ts       # tRPC API routes
  db.ts            # Database queries
  utils/           # Server utilities (Discord webhook, etc.)
drizzle/
  schema.ts        # Database schema
```

## 🎯 Key Features

- **Discord Integration** - Automatic posting of highlight cards to Discord
- **Playoff Bracket** - Interactive Season 17 playoff bracket with live scores
- **Series Summary Pages** - Detailed box scores and game recaps
- **Highlight Cards** - Professional sports graphics with team branding
- **Admin Dashboard** - Content management for highlights, playoffs, and awards

## 🔧 Admin Access

Navigate to `/admin` to access the admin dashboard (requires authentication).

## 📝 Content Guidelines

Refer to the [Visual Style Guide](./STYLE_GUIDE.md) for:
- Logo usage requirements
- Color palettes and typography
- Highlight card design standards
- Image compression guidelines
- Discord posting specifications

## 🌐 Deployment

This project is hosted on Manus. To deploy:
1. Save a checkpoint via `webdev_save_checkpoint`
2. Click **Publish** in the Management UI
3. Update `DISCORD_WEBHOOK_URL` to production domain after publishing

## 🔗 Links

- **Live Site:** https://hofsn-sports-bu28nutg.manus.space
- **Admin Dashboard:** https://hofsn-sports-bu28nutg.manus.space/admin

## 📄 License

© 2024 Hall of Fame Basketball Association. All rights reserved.
