# Netcomic Navigator - Business Spec

A webcomic browser that lets users discover and read webcomics from a curated list.

## Comic Discovery

The app loads a curated list of webcomics sourced from Kagi's SmallWeb project
(https://raw.githubusercontent.com/kagisearch/smallweb/main/smallcomic.txt). Comics are
displayed alphabetically in a sidebar with a total count. Users can search the list by
name or URL to quickly find comics.

## Reading Experience

When a user selects a comic, its latest entries (up to 20) are displayed as cards in the
main content area. Each entry shows the title, publication date, content, and any
associated images. Links within entries open in new tabs.

## Navigation & Sharing

Each comic has a permanent, shareable URL. Users can share or bookmark a direct link to
any comic, and it will be automatically selected when the link is opened. Browser
back/forward navigation works between comics.

Users can copy a comic's feed URL to their clipboard or visit the comic's original
website directly.

## Performance

Nearby comics are loaded in the background so they appear instantly when selected.
Content is cached for the duration of the session to avoid redundant loading.

## Responsive Design

The app uses a sidebar-plus-content layout on desktop. On mobile, the sidebar stacks
above the content area for a single-column experience.

## Hosting

The app requires no server infrastructure and can be hosted on any static file host. The
entry point `index.html` can be served from the project top folder..
