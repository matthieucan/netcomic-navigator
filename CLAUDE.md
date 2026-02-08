# Claude Code Context: Netcomic Navigator

## Project Overview

Netcomic Navigator is a frontend-only webcomic browser. It fetches a list of webcomic RSS feeds from Kagi's SmallWeb project and allows users to browse and read comic entries directly in the browser.

**Key constraint:** No backend. Everything runs client-side and must work when hosted on GitHub Pages or any static file server.

## Tech Stack

- Vanilla HTML, CSS, JavaScript (no frameworks, no build step)
- No dependencies or package.json
- Must work in modern browsers without transpilation

## File Structure

```
index.html    - Main HTML structure
styles.css    - All styling (dark theme, responsive)
app.js        - All application logic
README.md     - Project documentation
CLAUDE.md     - This file
```

## Architecture Decisions

### CORS Handling

Since we can't make direct cross-origin requests from a static site, we use public CORS proxies with a fallback chain:

```javascript
const CORS_PROXIES = [
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
];
```

The `fetchWithCorsProxy()` function tries direct fetch first, then each proxy in order.

### Feed Parsing

- Supports both RSS (`<channel>`) and Atom (`<feed>`) formats
- Extracts images from: `<media:content>`, `<media:thumbnail>`, `<enclosure>`, and inline HTML
- Resolves relative URLs using `resolveUrl(url, baseUrl)`
- Sanitizes HTML to prevent XSS while keeping images and links

### Data Source

Comic list comes from: `https://raw.githubusercontent.com/kagisearch/smallweb/main/smallcomic.txt`

This is a plain text file with one RSS/Atom feed URL per line.

## Key Functions in app.js

- `loadComicList()` - Fetches and parses the comic list on startup
- `selectComic(comic)` - Loads a comic's RSS feed and displays entries (checks cache first)
- `displayFeedData(feedData)` - Renders feed data to the UI
- `prefetchNearbyComics(currentComic)` - Queues prefetch of adjacent comics in the list
- `scheduleIdlePrefetch(comic)` - Fetches a comic's feed during browser idle time
- `parseFeed(xmlText, feedUrl)` - Detects RSS vs Atom and parses accordingly
- `parseRSSFeed(channel, baseUrl)` / `parseAtomFeed(feed, baseUrl)` - Format-specific parsing
- `extractMediaImage(item)` - Pulls images from media/enclosure tags
- `sanitizeHtml(html, baseUrl)` - Cleans HTML content, fixes relative URLs
- `filterComics(query)` - Search functionality
- `copyFeedUrl()` - Clipboard functionality

## Caching & Prefetching

- `feedCache` (Map) - Stores parsed feed data by URL
- When a comic is selected, the next 3 comics and previous 1 comic are prefetched during idle time
- Uses `requestIdleCallback` with fallback to `setTimeout`
- Cache is session-only (cleared on page refresh)

## UI Structure

```
.app
├── header (title, subtitle)
├── main
│   ├── .sidebar
│   │   ├── .search-container (search input)
│   │   ├── .comic-list-container (scrollable comic list)
│   │   └── .comic-count
│   └── .content
│       ├── #welcome-message (shown initially)
│       ├── #comic-content (shown when comic selected)
│       │   ├── .comic-header (title, copy button, visit link)
│       │   ├── #comic-description
│       │   └── #feed-entries (list of .feed-entry articles)
│       └── #error-message (shown on errors)
└── footer
```

## CSS Variables (Theme)

```css
--bg-primary: #1a1a2e;
--bg-secondary: #16213e;
--bg-tertiary: #0f3460;
--text-primary: #eaeaea;
--text-secondary: #a0a0a0;
--accent: #e94560;
--accent-hover: #ff6b6b;
--border-color: #2a2a4a;
```

## Running Locally

```bash
python3 -m http.server 8080
# Then open http://localhost:8080
```

## Guidelines for Changes

1. **No build tools** - Keep it vanilla JS/CSS/HTML
2. **No external dependencies** - Don't add npm packages or CDN scripts
3. **Maintain CORS compatibility** - Any new fetches to external URLs need proxy handling
4. **Sanitize user content** - All RSS content must go through `sanitizeHtml()`
5. **Keep it responsive** - Test mobile layout (sidebar stacks on top at 768px)
6. **Dark theme** - Use the CSS variables for colors
7. **Progressive enhancement** - Core functionality should work even if some features fail

## Known Issues / Future Improvements

- Sidebar scroll is tied to page scroll (needs CSS fix with `min-height: 0` on flex children)
- Some feeds may fail if all CORS proxies are down
- No offline support (feed cache is session-only)
- No favorites/bookmarking feature
- Could add keyboard navigation
- Could cache comic list in localStorage with TTL
