# MeMusic

---

## Features

- **Elegant UI:** A clean, elegant, and responsive interface that looks great on all devices.
- **Account-Free:** No sign-up required. Just open the app and start listening.
- **Local-First Storage:** All your data (playlists, favorites, history) is saved in your browser's local storage.
- **Comprehensive Search:** Quickly find songs, albums, artists, and public playlists.
- **Personal Library:**
    - Create and manage custom playlists.
    - Save your favorite songs and albums.
    - View your listening history.
- **Immersive Views:** Dedicated pages for albums, artists, and playlists with rich details.
- **Advanced Player:**
    - High-quality audio streaming with quality selection.
    - Standard controls: play/pause, next/previous, seek, and volume.
    - Player modes: shuffle and repeat (off, all, one).
- **Queue Management:**
    - View and manage the upcoming song queue.
    - Drag-and-drop to reorder songs.
    - Add songs to play next or at the end of the queue.
- **Single-File Downloads:** Download entire albums or playlists as a single `.zip` file for convenience.
- **Music Discovery:** Get song recommendations based on your listening history.

## Technology Stack

- **Frontend:** React, TypeScript
- **Styling:** TailwindCSS
- **State Management:** React Context API
- **Local Storage:** Custom `useLocalStorage` hook for persistent state.
- **Music Data:** Powered by an unofficial [JioSaavn API](https://github.com/sumitkolhe/jiosaavn-api).

## Project Structure

The project is organized into a logical folder structure to keep the codebase clean and maintainable.

```
/
├── components/
│   ├── layout/       # Main layout components (Sidebar, Player, etc.)
│   ├── ui/           # Reusable UI elements (Cards, Lists, Loader, etc.)
│   └── views/        # Page-level components (Home, Search, AlbumView, etc.)
├── context/          # React Context providers for global state management
├── hooks/            # Custom React hooks (e.g., useLocalStorage)
├── services/         # API interaction logic (e.g., jioSaavnApi.ts)
├── types.ts          # TypeScript type definitions for the application
├── App.tsx           # Main application component and routing logic
├── index.html        # The main HTML file
└── index.tsx         # The entry point of the React application
```