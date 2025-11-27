# Church-Specific PWA Implementation

This document describes the church-specific Progressive Web App (PWA) implementation that allows each church to have its own branded PWA experience, independent of the main system.

## Overview

The PWA is now fully church-specific, meaning:
- Each church gets its own app name, icons, and theme colors
- The manifest is dynamically generated based on the active church
- Service worker caches church-specific resources
- Install prompts show church-specific branding

## Architecture

### Server-Side Components

1. **`lib/church-pwa.ts`**
   - `getChurchPWAConfig(churchId?)`: Gets church-specific PWA configuration
   - `generateChurchManifest(churchId?)`: Generates church-specific manifest JSON
   - Fetches church data, theme colors, and logo from database

2. **`app/api/manifest/route.ts`**
   - Dynamic manifest endpoint (`/api/manifest`)
   - Returns church-specific manifest JSON
   - Cached for 1 hour

3. **`app/api/church/[id]/icon/[size]/route.ts`**
   - Serves church-specific icons from church logos
   - Supports sizes: 72, 96, 128, 144, 152, 192, 384, 512
   - Falls back to default icons if church logo not available

4. **`app/api/pwa/config/route.ts`**
   - Client-side API to fetch church PWA config
   - Used by install prompt component

### Client-Side Components

1. **`app/sw-register.tsx`**
   - Registers service worker in production mode
   - Handles service worker updates
   - Monitors controller changes

2. **`components/pwa-install-prompt.tsx`**
   - Church-aware install prompt
   - Fetches church config and displays church name
   - Shows install dialog with church branding

3. **`public/sw.js`**
   - Service worker for offline functionality
   - Caches church-specific resources
   - Handles fetch events with cache-first strategy

### Layout Updates

**`app/layout.tsx`**
- `generateMetadata()`: Uses church-specific PWA config for manifest, icons, and app name
- `generateViewport()`: Uses church-specific theme color
- Links to dynamic manifest endpoint (`/api/manifest`)

## Church Configuration

### Church Settings

The PWA uses the following church data:
- **Church Name**: Used for app name and short name
- **Church Logo**: Used to generate PWA icons (if available)
- **Theme Color**: From `ChurchSetting` with key `themeColor` (default: `#1E40AF`)

### Setting Theme Color

To set a custom theme color for a church:

```typescript
await prisma.churchSetting.upsert({
  where: {
    churchId_key: {
      churchId: "church-id",
      key: "themeColor",
    },
  },
  update: {
    value: "#FF5733", // Your custom color
  },
  create: {
    churchId: "church-id",
    key: "themeColor",
    value: "#FF5733",
    type: "string",
  },
});
```

## How It Works

### 1. Manifest Generation

When a user visits the app:
1. The layout calls `getChurchPWAConfig()` to get church-specific config
2. The manifest endpoint (`/api/manifest`) generates a dynamic manifest
3. The manifest includes:
   - Church-specific name and description
   - Church-specific icons (if logo available)
   - Church-specific theme color
   - Standard PWA shortcuts

### 2. Icon Generation

If a church has a logo:
- Icons are served via `/api/church/[id]/icon/[size]`
- The endpoint redirects to the church logo or generates resized versions
- Falls back to default icons if logo not available

### 3. Service Worker

The service worker:
- Caches church-specific resources
- Uses cache-first strategy for offline support
- Automatically updates when new version is available
- Cleans up old caches on activation

### 4. Install Prompt

The install prompt:
- Fetches church config on mount
- Displays church name in the prompt
- Uses church-specific description
- Only shows in production mode

## Multitenancy

### Church Selection

Currently, the system uses the **first active church** for PWA configuration. This works for:
- Single-church deployments
- Multi-church deployments where the first active church is the primary

### Future Enhancements

For true multitenancy with user-specific church selection:
1. Store `churchId` in user session or JWT token
2. Pass `churchId` to `getChurchPWAConfig(churchId)`
3. Update manifest endpoint to use session church
4. Update service worker to cache per-church resources

## Testing

### Local Development

1. **Check Manifest**:
   ```bash
   curl http://localhost:3000/api/manifest
   ```

2. **Check PWA Config**:
   ```bash
   curl http://localhost:3000/api/pwa/config
   ```

3. **Test Service Worker**:
   - Build for production: `npm run build`
   - Start production server: `npm start`
   - Open DevTools → Application → Service Workers
   - Check manifest in Application → Manifest

### Production Testing

1. **Lighthouse PWA Audit**:
   - Run Lighthouse in Chrome DevTools
   - Check PWA score and requirements

2. **Install Test**:
   - Visit the app on a supported device
   - Look for install prompt (appears after 3 seconds)
   - Test installation on different browsers

3. **Offline Test**:
   - Install the app
   - Turn off network
   - Verify cached pages still load

## Browser Support

- ✅ Chrome/Edge (Android & Desktop)
- ✅ Safari (iOS 11.3+)
- ✅ Firefox (Android)
- ⚠️ Safari (Desktop) - Limited support
- ⚠️ Firefox (Desktop) - Limited support

## Configuration Files

### Static Files (Fallback)

- `public/manifest.json`: Static manifest (kept as fallback)
- `public/icons/*.png`: Default icons (used if church logo not available)

### Dynamic Files

- `/api/manifest`: Dynamic church-specific manifest
- `/api/church/[id]/icon/[size]`: Dynamic church icons
- `/api/pwa/config`: Church PWA configuration

## Troubleshooting

### Manifest Not Loading

- Check `/api/manifest` endpoint returns valid JSON
- Verify church exists and is active
- Check browser console for errors

### Icons Not Showing

- Verify church logo is set in database
- Check `/api/church/[id]/icon/[size]` endpoint
- Ensure icon files exist in `public/icons/`

### Service Worker Not Registering

- Ensure you're in production mode (`npm run build && npm start`)
- Check browser console for registration errors
- Verify `public/sw.js` exists and is valid

### Install Prompt Not Showing

- Check browser supports PWA installation
- Verify service worker is registered
- Check if app is already installed
- Ensure `beforeinstallprompt` event is firing

## Security Considerations

1. **Church Isolation**: Each church's PWA is isolated by manifest and cache
2. **Icon Access**: Church icons are publicly accessible (consider authentication if needed)
3. **Manifest Caching**: Manifest is cached for 1 hour (adjust if needed)

## Performance

- Manifest is cached server-side (1 hour)
- Icons are served with appropriate caching headers
- Service worker caches resources for offline access
- Lazy loading of PWA config in install prompt

## Future Improvements

1. **Image Resizing**: Implement proper image resizing for church logos
2. **Multiple Icon Formats**: Support WebP, SVG formats
3. **Push Notifications**: Church-specific push notifications
4. **Background Sync**: Sync data when connection restored
5. **App Shortcuts**: Church-specific app shortcuts
6. **Splash Screens**: Church-branded splash screens

