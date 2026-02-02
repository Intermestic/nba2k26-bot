# HoFSN Visual Style Guide
**Hall of Fame Sports Network Brand Standards**

---

## 1. Brand Identity

### League Name
**Official Name:** Hall of Fame Basketball Association  
**Network Name:** HoFSN (Hall of Fame Sports Network)  
**Tagline:** "Your premier destination for Hall of Fame Basketball Association News and Highlights"

---

## 2. Official League Logo

### Authentic Logo
**File Path:** `/client/public/hall-of-champions-logo.png`

**Description:** Gold basketball with "Hall of Fame" text in green and "BASKETBALL Association" in gold, shield-shaped badge design with basketball net pattern.

**Usage Rules:**
- ✅ **ALWAYS** use this authentic logo for all highlight cards, graphics, and official content
- ❌ **NEVER** use generic NBA logos, unofficial variations, or AI-generated alternatives
- ✅ Logo must be clearly visible and prominently displayed
- ✅ Maintain proper spacing around the logo (minimum 20px clearance)

### Logo Placement
- **Highlight Cards:** Top-left or center of left panel
- **Headers:** Top-center or top-left
- **Footers:** Center alignment with copyright text

---

## 3. Color Palette

### Primary Colors
| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| **Gold** | `#FFD700` | `rgb(255, 215, 0)` | Primary brand color, logo, accents |
| **Black** | `#000000` | `rgb(0, 0, 0)` | Text, backgrounds |
| **White** | `#FFFFFF` | `rgb(255, 255, 255)` | Text on dark backgrounds, clean sections |

### Team-Specific Colors
When creating team-specific content (highlight cards, series pages), use the team's primary colors:

| Team | Primary Color | Hex Code | Secondary Color | Hex Code |
|------|---------------|----------|-----------------|----------|
| **Rockets** | Red | `#CE1141` | Black | `#000000` |
| **Cavaliers** | Wine | `#6F263D` | Gold | `#FFB81C` |
| **Kings** | Purple | `#5A2D81` | Silver | `#63727A` |
| **Bulls** | Red | `#CE1141` | Black | `#000000` |
| **Nuggets** | Navy | `#0E2240` | Gold | `#FEC524` |
| **Jazz** | Navy | `#002B5C` | Green | `#00471B` |
| **Pistons** | Blue | `#C8102E` | Red | `#1D42BA` |

### Background Colors
- **Dark Mode (Default):** `#0a0a0a` to `#1a1a1a`
- **Accent Backgrounds:** Use team colors at 10-20% opacity
- **Card Backgrounds:** `#1e1e1e` with subtle gradients

---

## 4. Typography

### Font Families
**Primary Font:** System UI Stack  
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

### Font Weights & Sizes

#### Headlines
- **Hero Titles:** 48-72px, Bold (700-900)
- **Page Titles:** 36-48px, Bold (700)
- **Section Headers:** 24-32px, Semi-Bold (600)

#### Body Text
- **Body Copy:** 16-18px, Regular (400)
- **Small Text:** 14px, Regular (400)
- **Captions:** 12-14px, Regular (400)

#### Highlight Cards
- **Main Text:** 40-60px, Extra Bold (800-900), ALL CAPS
- **Scores:** 80-120px, Extra Bold (900)
- **Subtext:** 20-28px, Bold (700)

---

## 5. Highlight Card Design Standards

### Layout Structure
**Aspect Ratio:** 16:9 (1920x1080px or 1600x900px)

**Two-Column Layout:**
- **Left Panel (40% width):** Text, scores, league logo
- **Right Panel (60% width):** Player image

### Left Panel Elements
1. **League Logo** (top, 150-200px width)
2. **Headline Text** (center, white, bold, ALL CAPS)
3. **Score** (large, white, extra bold)
4. **Series Status** (bottom, white, bold)

### Right Panel Elements
- **Player Photo:** Dynamic action shot or celebration
- **Lighting:** Dramatic spotlight effect from top-left
- **Background:** Team colors with gradient
- **Confetti/Effects:** Optional for series wins

### Image Specifications
- **Format:** PNG for generation, convert to JPG for web
- **Compression:** Target 150-300KB for Discord compatibility
- **Quality:** 85% JPEG quality after compression
- **Resolution:** 1200px width maximum

### Compression Command
```bash
convert input.png -resize 1200x -quality 85 output.jpg
```

---

## 6. Series Summary Pages

### Header Design
- **Team Logos:** Side-by-side at top
- **Series Title:** Bold, 36-48px
- **Series Score:** Large, team colors
- **Navigation:** "Back to Playoff Bracket" and "Home" buttons

### Box Score Tables
- **Collapsible sections** for each game
- **Alternating row colors** for readability
- **Bold text** for leading stats
- **Team colors** for headers

### Key Takeaways
- **Icon bullets** (⚡ lightning bolt)
- **Bold player names**
- **Highlight significant stats** in context

---

## 7. Navigation Standards

### Required Navigation Elements
Every page must include:
1. **Home Link:** Always accessible (top-left or footer)
2. **Back Button:** For nested pages (series, game recaps)
3. **Breadcrumbs:** For deep navigation (optional but recommended)

### Button Styles
- **Primary Actions:** Gold background (`#FFD700`), black text
- **Secondary Actions:** Transparent with gold border
- **Back Buttons:** Red background (`#DC2626`), white text
- **Hover States:** Slightly darker shade with transition

---

## 8. Content Guidelines

### Writing Style
- **Headlines:** Bold, action-oriented, ALL CAPS for emphasis
- **Body Text:** Professional, informative, avoid excessive hype
- **Stats:** Always include context (e.g., "29 PTS on 66.7% FG")
- **Player Names:** Full name on first mention, last name thereafter

### Image Alt Text
Always include descriptive alt text:
- ✅ "Anthony Edwards celebrates after scoring 35 points for the Rockets"
- ❌ "Player image"

---

## 9. Discord Integration

### Post Format
```json
{
  "title": "Series Name or Headline",
  "url": "https://hofsn-sports-bu28nutg.manus.space/page-url",
  "imageUrl": "https://hofsn-sports-bu28nutg.manus.space/image-name.jpg"
}
```

### Image Requirements
- **Max File Size:** 500KB (Discord embed limit: 8MB, but aim for 500KB for reliability)
- **Format:** JPEG (better compression than PNG)
- **Dimensions:** 1200px width recommended
- **Quality:** 85% JPEG quality

---

## 10. Admin Dashboard

### Highlight Card Creation
**Required Fields:**
- Title (concise, descriptive)
- Image (compressed, <500KB)
- Link (series page or game recap)
- Tags (both, playoff, etc.)
- Post to Discord toggle (default: ON)

### Image Upload Workflow
1. Generate/upload image
2. Compress to <500KB
3. Add to `/client/public/` directory
4. Reference as `/image-name.jpg` in database
5. Verify image loads on published site before Discord post

---

## 11. Quality Checklist

Before publishing any content, verify:

- [ ] Authentic Hall of Fame Basketball Association logo is used
- [ ] Image file size is under 500KB
- [ ] All text is readable with sufficient contrast
- [ ] Navigation links work correctly
- [ ] Mobile responsive design is maintained
- [ ] Discord post includes correct URL and image
- [ ] Player images are accurate and high quality
- [ ] Team colors are correct
- [ ] Typography follows size and weight standards
- [ ] All links are tested and functional

---

## 12. File Organization

### Directory Structure
```
client/public/
├── hall-of-champions-logo.png      # Authentic league logo
├── hofsn-logo.png                  # Network logo
├── [team]-[description].jpg        # Highlight cards (compressed)
├── hero-bg.jpg                     # Homepage hero background
└── logos/                          # Team logos directory
```

### Naming Conventions
- **Highlight Cards:** `[team1]-[team2]-[description].jpg`
  - Example: `rockets-sweep-cavs-final-small.jpg`
- **Series Pages:** `/playoffs/[team1]-[team2]-series`
  - Example: `/playoffs/cavs-rockets-series`
- **Game Recaps:** `/playoffs/[team1]-[team2]-game[number]`
  - Example: `/playoffs/cavs-rockets-game1`

---

## 13. Brand Voice

### Tone
- **Professional** yet **engaging**
- **Informative** without being dry
- **Celebratory** for achievements
- **Respectful** of all teams and players

### Language
- Use active voice
- Be specific with stats and context
- Avoid clichés and overused phrases
- Emphasize storylines and narratives

---

## 14. Accessibility

### Color Contrast
- Maintain WCAG AA standard (4.5:1 for normal text)
- Use white text on dark backgrounds
- Ensure gold accents have sufficient contrast

### Alt Text
- Descriptive and concise
- Include player names and context
- Avoid redundant phrases like "image of"

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Visible focus states on all buttons and links

---

## 15. Version Control

**Document Version:** 1.0  
**Last Updated:** January 25, 2026  
**Maintained By:** HoFSN Development Team

### Change Log
- **v1.0 (Jan 25, 2026):** Initial style guide creation with authentic logo standards, color palettes, typography, and highlight card specifications

---

## Quick Reference Card

### Essential Assets
| Asset | Location | Usage |
|-------|----------|-------|
| League Logo | `/client/public/hall-of-champions-logo.png` | All official content |
| Network Logo | `/client/public/hofsn-logo.png` | Headers, branding |
| Hero Background | `/client/public/hero-bg.jpg` | Homepage hero section |

### Key Colors
- **Gold:** `#FFD700` (Primary brand)
- **Black:** `#000000` (Text, backgrounds)
- **White:** `#FFFFFF` (Text on dark)

### Image Specs
- **Format:** JPEG (compressed)
- **Max Size:** 500KB
- **Width:** 1200px
- **Quality:** 85%

### Typography
- **Headlines:** 48-72px, Bold
- **Body:** 16-18px, Regular
- **Scores:** 80-120px, Extra Bold

---

**For questions or updates to this style guide, contact the HoFSN development team.**
