// Webcomic Browser Application

const COMIC_LIST_URL = 'https://raw.githubusercontent.com/kagisearch/smallweb/main/smallcomic.txt';

// CORS proxies to try (in order of preference)
const CORS_PROXIES = [
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
];

// DOM Elements
const comicListEl = document.getElementById('comic-list');
const searchInputEl = document.getElementById('search-input');
const comicCountEl = document.getElementById('comic-count');
const welcomeMessageEl = document.getElementById('welcome-message');
const comicContentEl = document.getElementById('comic-content');
const errorMessageEl = document.getElementById('error-message');
const comicTitleEl = document.getElementById('comic-title');
const comicLinkEl = document.getElementById('comic-link');
const comicDescriptionEl = document.getElementById('comic-description');
const feedEntriesEl = document.getElementById('feed-entries');
const errorTextEl = document.getElementById('error-text');
const copyFeedUrlBtn = document.getElementById('copy-feed-url');

// State
let comics = [];
let filteredComics = [];
let selectedComic = null;

// Extract a readable name from a feed URL
function extractComicName(url) {
    try {
        const urlObj = new URL(url);
        let name = urlObj.hostname;

        // Remove common prefixes
        name = name.replace(/^(www\.|feeds\.|feed\.|rss\.)/, '');

        // Handle feedburner URLs
        if (name.includes('feedburner.com')) {
            const pathParts = urlObj.pathname.split('/').filter(p => p);
            if (pathParts.length > 0) {
                name = pathParts[pathParts.length - 1];
            }
        }

        // Handle blogspot URLs
        if (name.includes('blogspot.com')) {
            name = name.replace('.blogspot.com', '');
        }

        // Remove common suffixes
        name = name.replace(/\.(com|net|org|io|co|me|info)$/, '');

        // Convert to title case and clean up
        name = name
            .replace(/[-_]/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');

        return name || url;
    } catch (e) {
        return url;
    }
}

// Get the base site URL from a feed URL
function getSiteUrl(feedUrl) {
    try {
        const urlObj = new URL(feedUrl);
        return `${urlObj.protocol}//${urlObj.hostname}`;
    } catch (e) {
        return feedUrl;
    }
}

// Fetch with CORS proxy fallback
async function fetchWithCorsProxy(url) {
    // First try direct fetch (might work for some URLs)
    try {
        const response = await fetch(url);
        if (response.ok) {
            return await response.text();
        }
    } catch (e) {
        // Direct fetch failed, try proxies
    }

    // Try each CORS proxy
    for (const proxyFn of CORS_PROXIES) {
        try {
            const proxyUrl = proxyFn(url);
            const response = await fetch(proxyUrl);
            if (response.ok) {
                return await response.text();
            }
        } catch (e) {
            // Try next proxy
            continue;
        }
    }

    throw new Error('Failed to fetch content through all available proxies');
}

// Load the comic list
async function loadComicList() {
    try {
        const response = await fetch(COMIC_LIST_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch comic list');
        }

        const text = await response.text();
        const urls = text.split('\n').filter(url => url.trim());

        comics = urls.map(url => ({
            url: url.trim(),
            name: extractComicName(url.trim()),
            siteUrl: getSiteUrl(url.trim())
        }));

        // Sort alphabetically by name
        comics.sort((a, b) => a.name.localeCompare(b.name));

        filteredComics = [...comics];
        renderComicList();
        updateComicCount();
    } catch (error) {
        comicListEl.innerHTML = `<div class="error-message">Failed to load comics: ${error.message}</div>`;
    }
}

// Render the comic list
function renderComicList() {
    if (filteredComics.length === 0) {
        comicListEl.innerHTML = '<div class="loading">No comics found</div>';
        return;
    }

    comicListEl.innerHTML = filteredComics.map((comic, index) => `
        <div class="comic-item${selectedComic === comic ? ' active' : ''}"
             data-index="${comics.indexOf(comic)}"
             title="${comic.url}">
            ${comic.name}
        </div>
    `).join('');

    // Add click handlers
    comicListEl.querySelectorAll('.comic-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            selectComic(comics[index]);
        });
    });
}

// Update comic count display
function updateComicCount() {
    const total = comics.length;
    const showing = filteredComics.length;

    if (showing === total) {
        comicCountEl.textContent = `${total} comics`;
    } else {
        comicCountEl.textContent = `${showing} of ${total} comics`;
    }
}

// Filter comics by search query
function filterComics(query) {
    const searchTerm = query.toLowerCase().trim();

    if (!searchTerm) {
        filteredComics = [...comics];
    } else {
        filteredComics = comics.filter(comic =>
            comic.name.toLowerCase().includes(searchTerm) ||
            comic.url.toLowerCase().includes(searchTerm)
        );
    }

    renderComicList();
    updateComicCount();
}

// Select and load a comic
async function selectComic(comic) {
    selectedComic = comic;
    renderComicList();

    // Show content area, hide others
    welcomeMessageEl.style.display = 'none';
    errorMessageEl.style.display = 'none';
    comicContentEl.style.display = 'block';

    // Set header info
    comicTitleEl.textContent = comic.name;
    comicLinkEl.href = comic.siteUrl;
    comicDescriptionEl.textContent = '';

    // Show loading state
    feedEntriesEl.innerHTML = '<div class="loading">Loading feed</div>';

    try {
        const feedContent = await fetchWithCorsProxy(comic.url);
        const feedData = parseFeed(feedContent, comic.url);

        if (feedData.description) {
            comicDescriptionEl.textContent = feedData.description;
        }

        if (feedData.link) {
            comicLinkEl.href = feedData.link;
        }

        renderFeedEntries(feedData.entries, feedData.baseUrl);
    } catch (error) {
        feedEntriesEl.innerHTML = `
            <div class="error-message">
                <p>Failed to load feed: ${error.message}</p>
                <p style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-secondary);">
                    Feed URL: <a href="${comic.url}" target="_blank">${comic.url}</a>
                </p>
            </div>
        `;
    }
}

// Resolve a potentially relative URL against a base URL
function resolveUrl(url, baseUrl) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
        return url.startsWith('//') ? 'https:' + url : url;
    }
    try {
        return new URL(url, baseUrl).href;
    } catch (e) {
        return url;
    }
}

// Get base URL from feed URL
function getBaseUrl(feedUrl) {
    try {
        const url = new URL(feedUrl);
        return `${url.protocol}//${url.hostname}`;
    } catch (e) {
        return feedUrl;
    }
}

// Parse RSS or Atom feed
function parseFeed(xmlText, feedUrl) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    const baseUrl = getBaseUrl(feedUrl);

    // Check for parsing errors
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
        throw new Error('Invalid feed format');
    }

    // Detect feed type and parse accordingly
    const rssChannel = doc.querySelector('channel');
    const atomFeed = doc.querySelector('feed');

    if (rssChannel) {
        return parseRSSFeed(rssChannel, baseUrl);
    } else if (atomFeed) {
        return parseAtomFeed(atomFeed, baseUrl);
    } else {
        throw new Error('Unknown feed format');
    }
}

// Extract image URL from media:content, media:thumbnail, or enclosure
function extractMediaImage(item) {
    // Try media:content
    const mediaContent = item.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'content')[0] ||
                         item.querySelector('[medium="image"]');
    if (mediaContent) {
        const url = mediaContent.getAttribute('url');
        if (url) return url;
    }

    // Try media:thumbnail
    const mediaThumbnail = item.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'thumbnail')[0];
    if (mediaThumbnail) {
        const url = mediaThumbnail.getAttribute('url');
        if (url) return url;
    }

    // Try enclosure with image type
    const enclosure = item.querySelector('enclosure');
    if (enclosure) {
        const type = enclosure.getAttribute('type') || '';
        if (type.startsWith('image/')) {
            return enclosure.getAttribute('url');
        }
    }

    return null;
}

// Parse RSS feed
function parseRSSFeed(channel, baseUrl) {
    const entries = [];
    const items = channel.querySelectorAll('item');

    items.forEach(item => {
        const content = getElementText(item, 'content\\:encoded') ||
                       getElementText(item, 'description') || '';
        const mediaImage = extractMediaImage(item);

        entries.push({
            title: getElementText(item, 'title') || 'Untitled',
            link: getElementText(item, 'link') || '',
            date: parseDate(getElementText(item, 'pubDate')),
            content: content,
            mediaImage: mediaImage
        });
    });

    return {
        title: getElementText(channel, 'title'),
        description: getElementText(channel, 'description'),
        link: getElementText(channel, 'link'),
        baseUrl: baseUrl,
        entries: entries.slice(0, 20) // Limit to 20 entries
    };
}

// Parse Atom feed
function parseAtomFeed(feed, baseUrl) {
    const entries = [];
    const items = feed.querySelectorAll('entry');

    items.forEach(item => {
        const linkEl = item.querySelector('link[rel="alternate"]') || item.querySelector('link');
        const link = linkEl ? linkEl.getAttribute('href') : '';
        const content = getElementText(item, 'content') || getElementText(item, 'summary') || '';
        const mediaImage = extractMediaImage(item);

        entries.push({
            title: getElementText(item, 'title') || 'Untitled',
            link: link,
            date: parseDate(getElementText(item, 'published') || getElementText(item, 'updated')),
            content: content,
            mediaImage: mediaImage
        });
    });

    const feedLinkEl = feed.querySelector('link[rel="alternate"]') || feed.querySelector('link');
    const feedLink = feedLinkEl ? feedLinkEl.getAttribute('href') : '';

    return {
        title: getElementText(feed, 'title'),
        description: getElementText(feed, 'subtitle'),
        link: feedLink,
        baseUrl: baseUrl,
        entries: entries.slice(0, 20) // Limit to 20 entries
    };
}

// Get text content of an element
function getElementText(parent, selector) {
    const el = parent.querySelector(selector);
    return el ? el.textContent : '';
}

// Parse date string
function parseDate(dateStr) {
    if (!dateStr) return null;

    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return null;
        return date;
    } catch (e) {
        return null;
    }
}

// Format date for display
function formatDate(date) {
    if (!date) return '';

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Render feed entries
function renderFeedEntries(entries, baseUrl) {
    if (entries.length === 0) {
        feedEntriesEl.innerHTML = '<div class="loading">No entries found in this feed</div>';
        return;
    }

    feedEntriesEl.innerHTML = entries.map(entry => {
        // Check if content already has images
        const hasImages = /<img\s/i.test(entry.content);
        const mediaImageHtml = entry.mediaImage && !hasImages
            ? `<img src="${escapeHtml(entry.mediaImage)}" alt="${escapeHtml(entry.title)}" loading="lazy">`
            : '';

        return `
            <article class="feed-entry">
                <h3>
                    ${entry.link
                        ? `<a href="${entry.link}" target="_blank">${escapeHtml(entry.title)}</a>`
                        : escapeHtml(entry.title)
                    }
                </h3>
                ${entry.date ? `<div class="entry-date">${formatDate(entry.date)}</div>` : ''}
                <div class="entry-content">
                    ${mediaImageHtml}
                    ${sanitizeHtml(entry.content, baseUrl)}
                </div>
            </article>
        `;
    }).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Sanitize HTML content (allow safe tags) and fix relative URLs
function sanitizeHtml(html, baseUrl) {
    // Create a temporary element to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Remove script tags and event handlers
    temp.querySelectorAll('script, style').forEach(el => el.remove());

    // Process all elements
    temp.querySelectorAll('*').forEach(el => {
        // Remove all on* attributes and javascript: URLs
        Array.from(el.attributes).forEach(attr => {
            if (attr.name.startsWith('on') ||
                (attr.name === 'href' && attr.value.startsWith('javascript:'))) {
                el.removeAttribute(attr.name);
            }
        });
    });

    // Fix relative image URLs
    if (baseUrl) {
        temp.querySelectorAll('img').forEach(img => {
            const src = img.getAttribute('src');
            if (src) {
                img.setAttribute('src', resolveUrl(src, baseUrl));
            }
            // Also handle srcset
            const srcset = img.getAttribute('srcset');
            if (srcset) {
                const fixedSrcset = srcset.split(',').map(part => {
                    const [url, descriptor] = part.trim().split(/\s+/);
                    return resolveUrl(url, baseUrl) + (descriptor ? ' ' + descriptor : '');
                }).join(', ');
                img.setAttribute('srcset', fixedSrcset);
            }
            // Add loading="lazy" for performance
            img.setAttribute('loading', 'lazy');
        });

        // Fix relative link URLs
        temp.querySelectorAll('a').forEach(a => {
            const href = a.getAttribute('href');
            if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
                a.setAttribute('href', resolveUrl(href, baseUrl));
                a.setAttribute('target', '_blank');
                a.setAttribute('rel', 'noopener noreferrer');
            }
        });
    }

    return temp.innerHTML;
}

// Copy feed URL to clipboard
async function copyFeedUrl() {
    if (!selectedComic) return;

    try {
        await navigator.clipboard.writeText(selectedComic.url);
        copyFeedUrlBtn.textContent = 'Copied!';
        copyFeedUrlBtn.classList.add('copied');

        setTimeout(() => {
            copyFeedUrlBtn.textContent = 'Copy Feed URL';
            copyFeedUrlBtn.classList.remove('copied');
        }, 2000);
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = selectedComic.url;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        copyFeedUrlBtn.textContent = 'Copied!';
        copyFeedUrlBtn.classList.add('copied');

        setTimeout(() => {
            copyFeedUrlBtn.textContent = 'Copy Feed URL';
            copyFeedUrlBtn.classList.remove('copied');
        }, 2000);
    }
}

// Initialize the application
function init() {
    // Load comic list
    loadComicList();

    // Set up search input
    let searchTimeout;
    searchInputEl.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterComics(e.target.value);
        }, 200);
    });

    // Set up copy feed URL button
    copyFeedUrlBtn.addEventListener('click', copyFeedUrl);
}

// Start the app
init();
