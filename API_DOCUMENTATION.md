# NBA 2K26 Database - Public API Documentation

Base URL: `https://hof17roster.manus.space/api/public`

All endpoints return JSON responses with CORS enabled for cross-origin requests.

---

## Endpoints

### 1. Get All Teams

**GET** `/teams`

Returns list of all NBA teams with their logo URLs.

**Response:**
```json
{
  "success": true,
  "count": 30,
  "teams": [
    {
      "name": "Lakers",
      "logo": "https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg"
    },
    ...
  ]
}
```

**Example:**
```bash
curl https://hof17roster.manus.space/api/public/teams
```

---

### 2. Get Specific Team

**GET** `/teams/:teamName`

Returns info for a specific team.

**Parameters:**
- `teamName` (path): Team name (e.g., "Lakers", "Warriors")

**Response:**
```json
{
  "success": true,
  "team": {
    "name": "Lakers",
    "logo": "https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg"
  }
}
```

**Example:**
```bash
curl https://hof17roster.manus.space/api/public/teams/Lakers
```

---

### 3. Get Team Roster

**GET** `/teams/:teamName/roster`

Returns complete roster for a specific team with player details.

**Parameters:**
- `teamName` (path): Team name (e.g., "Lakers", "Warriors")

**Response:**
```json
{
  "success": true,
  "team": "Lakers",
  "logo": "https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg",
  "count": 13,
  "roster": [
    {
      "id": "P0062",
      "name": "Oshae Brissett",
      "overall": 70,
      "photoUrl": "https://d2xsxph8kpxj0f.cloudfront.net/.../player.png",
      "playerPageUrl": "https://www.2kratings.com/oshae-brissett",
      "badgeCount": null
    },
    ...
  ]
}
```

**Example:**
```bash
curl https://hof17roster.manus.space/api/public/teams/Lakers/roster
```

---

### 4. Get All Players

**GET** `/players`

Returns list of all players with optional filtering.

**Query Parameters:**
- `team` (optional): Filter by team name
- `limit` (optional): Max results to return (default: 1000)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "count": 640,
  "players": [
    {
      "id": "P0001",
      "name": "Precious Achiuwa",
      "overall": 76,
      "team": "Knicks",
      "photoUrl": "https://cdn.nba.com/headshots/nba/latest/1040x760/1630173.png",
      "playerPageUrl": "https://www.2kratings.com/precious-achiuwa",
      "badgeCount": null
    },
    ...
  ]
}
```

**Examples:**
```bash
# Get all players
curl https://hof17roster.manus.space/api/public/players

# Get Lakers players only
curl https://hof17roster.manus.space/api/public/players?team=Lakers

# Get first 50 players
curl https://hof17roster.manus.space/api/public/players?limit=50

# Pagination
curl https://hof17roster.manus.space/api/public/players?limit=50&offset=50
```

---

### 5. Get Specific Player

**GET** `/players/:id`

Returns details for a specific player.

**Parameters:**
- `id` (path): Player ID (e.g., "P0024")

**Response:**
```json
{
  "success": true,
  "player": {
    "id": "P0024",
    "name": "Mohamed Bamba",
    "overall": 71,
    "team": "Mavericks",
    "photoUrl": "https://d2xsxph8kpxj0f.cloudfront.net/.../player.png",
    "playerPageUrl": "https://www.2kratings.com/mohamed-bamba",
    "badgeCount": null
  }
}
```

**Example:**
```bash
curl https://hof17roster.manus.space/api/public/players/P0024
```

---

## Data Fields

### Player Object
- `id`: Unique player identifier (string)
- `name`: Player full name (string)
- `overall`: NBA 2K26 overall rating (number, 0-99)
- `team`: Current team name (string)
- `photoUrl`: Player headshot image URL (string, nullable)
- `playerPageUrl`: Link to 2kratings.com player page (string, nullable)
- `badgeCount`: Number of badges (number, nullable)

### Team Object
- `name`: Team name (string)
- `logo`: Team logo SVG URL from NBA.com CDN (string)

---

## Available Teams

76ers, Bucks, Bulls, Cavaliers, Celtics, Clippers, Grizzlies, Hawks, Heat, Hornets, Jazz, Kings, Knicks, Lakers, Magic, Mavericks, Nets, Nuggets, Pacers, Pelicans, Pistons, Raptors, Rockets, Spurs, Suns, Thunder, Timberwolves, Trail Blazers, Warriors, Wizards

---

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": "Error message description"
}
```

HTTP Status Codes:
- `200`: Success
- `404`: Resource not found
- `500`: Server error

---

## Usage in News Website

### Example: Display Team Roster in Article

```javascript
// Fetch Lakers roster for game recap article
const response = await fetch('https://hof17roster.manus.space/api/public/teams/Lakers/roster');
const data = await response.json();

// Display team logo
const teamLogo = data.logo;

// Show top players
const topPlayers = data.roster
  .sort((a, b) => b.overall - a.overall)
  .slice(0, 5);

topPlayers.forEach(player => {
  console.log(`${player.name} (${player.overall} OVR)`);
  console.log(`Photo: ${player.photoUrl}`);
});
```

### Example: Get Player Info for Game Stats

```javascript
// Get specific player for game stats display
const playerId = 'P0024';
const response = await fetch(`https://hof17roster.manus.space/api/public/players/${playerId}`);
const data = await response.json();

const player = data.player;
// Display player photo and rating alongside game stats
```

---

## Notes

- All photo URLs are permanent CDN links (CloudFront or NBA.com)
- 100% photo coverage for all 640 players
- No authentication required for public API endpoints
- CORS enabled for cross-origin requests
- Rate limiting: Not currently enforced
