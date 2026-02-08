# Netcomic Navigator

A frontend-only webcomic browser that lets you browse and read webcomics from [Kagi's SmallWeb](https://github.com/kagisearch/smallweb) comic feed collection.

## Features

- Browse 100+ webcomics from Kagi's curated list
- Search/filter comics by name
- Read the latest entries from each comic's RSS/Atom feed
- Copy feed URLs to clipboard
- Dark theme UI
- No backend required - runs entirely in the browser

## How It Was Built

This project was vibe coded with [Claude Code](https://claude.ai/code), Anthropic's AI coding assistant. The entire application was generated through a conversational development process, starting from a simple README spec and iteratively adding features and fixes based on feedback.

The development flow:
1. Started with a basic spec: "frontend-only viewer for webcomics using Kagi's RSS feed list"
2. Claude generated the initial HTML, CSS, and JavaScript
3. Issues were identified through testing (images not loading, CSS 404s, scroll behavior)
4. Each issue was described conversationally and Claude applied fixes

## Architecture

### Static Frontend

The application consists of three files:
- `index.html` - Page structure
- `styles.css` - Dark theme styling
- `app.js` - All application logic

No build step, no dependencies, no framework. Just vanilla HTML, CSS, and JavaScript.

### CORS Workarounds

Since this is a frontend-only application hosted on static pages (e.g., GitHub Pages), it cannot directly fetch RSS feeds from other domains due to browser CORS restrictions.

**Solution: CORS Proxy Cascade**

The app uses multiple public CORS proxy services as fallbacks:

```javascript
const CORS_PROXIES = [
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
];
```

When fetching a feed:
1. First attempts a direct fetch (works for feeds with permissive CORS headers)
2. If that fails, tries each proxy in order until one succeeds
3. If all proxies fail, displays an error message

**Trade-offs:**
- *Pro:* No backend infrastructure needed
- *Con:* Dependent on third-party proxy availability
- *Con:* Slower than direct fetches due to proxy hop

### Feed Parsing

The app handles both RSS and Atom feed formats:
- Detects format by checking for `<channel>` (RSS) or `<feed>` (Atom) elements
- Extracts images from multiple sources: `<media:content>`, `<media:thumbnail>`, `<enclosure>`, and inline `<img>` tags
- Resolves relative URLs to absolute using the feed's base URL
- Sanitizes HTML content to prevent XSS while preserving images and links

### Comic List Source

The comic list is fetched from:
```
https://raw.githubusercontent.com/kagisearch/smallweb/main/smallcomic.txt
```

This raw GitHub URL has permissive CORS headers, so no proxy is needed for the initial list load.

## Running Locally

### Option 1: Python (recommended)

```bash
cd /path/to/webcomic-browser
python3 -m http.server 8080
```

Then open http://localhost:8080

### Option 2: Node.js

```bash
npx serve .
```

### Option 3: PHP

```bash
php -S localhost:8080
```

### Option 4: Open directly

You can open `index.html` directly in a browser, but some features may not work due to CORS restrictions on `file://` URLs.

## Deployment

Since there's no backend, deployment is straightforward:

**GitHub Pages:**
1. Push to a GitHub repository
2. Go to Settings → Pages
3. Select source branch
4. Site will be live at `https://username.github.io/repo-name`

**Any static host:**
Upload the three files (`index.html`, `styles.css`, `app.js`) to any static hosting service (Netlify, Vercel, Cloudflare Pages, etc.)

## License

MIT
