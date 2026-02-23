# Asset Management & Deployment Guide

## Sound Effects Asset URLs

All sound effects are sourced from publicly available, royalty-free CDNs. These URLs are embedded directly in the code.

### Current Sound URLs

```typescript
// src/services/soundService.ts
const SOUND_URLS = {
  jump: 'https://assets.codepen.io/4358584/Flapy_Bird_sound_assets_Jump.wav',
  score: 'https://assets.codepen.io/4358584/Flapy_Bird_sound_assets_Point.wav',
  gameover: 'https://assets.codepen.io/4358584/Flapy_Bird_sound_assets_Hit.wav'
}
```

These are publicly available assets hosted on CodePen CDN and do not require authentication.

### Using Alternative Sound Sources

If you want to replace sound URLs, modify the `SOUND_URLS` object:

```typescript
const SOUND_URLS = {
  jump: 'https://your-cdn.com/bird-jump.wav',
  score: 'https://your-cdn.com/score-sound.mp3',
  gameover: 'https://your-cdn.com/game-over.wav'
}
```

**Supported audio formats**: WAV, MP3, OGG, M4A

**Recommended sources for free sounds**:
- **Zapsplat**: https://www.zapsplat.com (no registration required)
- **Freesound**: https://freesound.org (requires free account)
- **YouTube Audio Library**: https://www.youtube.com/audiolibrary (requires Google account)
- **FreeSound Exchange**: https://www.freesoundexchange.com

## Visual Assets

All visual elements use CSS and SVG data URLs (no external image files required).

### Bird Sprite
- **Implementation**: SVG data URL (inline in GameScreen.tsx)
- **Format**: Simple SVG with circle, line, and polygon elements
- **Style**: Yellow circle with black eye and orange beak
- **Size**: 30x30 pixels

### Pipe Sprites
- **Implementation**: CSS rectangles with borders
- **Colors**: Green gradient with darker border
- **Features**: Rounded pipe endings using ::before and ::after pseudo-elements
- **Sizes**: Vary based on difficulty and gap positions

### Background
- **Implementation**: CSS linear gradient
- **Colors**: Sky blue (#87CEEB) to light blue (#E0F6FF)
- **Animation**: Static (no motion required)

## Deployment Checklist

### Before Deploying

- [ ] Verify game works in development (`npm run dev`)
- [ ] Test all features:
  - [ ] Name registration
  - [ ] Difficulty selection
  - [ ] Gameplay mechanics
  - [ ] Collision detection
  - [ ] Score calculation
  - [ ] Game over screen
  - [ ] Leaderboard
- [ ] Test on multiple devices:
  - [ ] Desktop (Chrome, Firefox, Safari)
  - [ ] Tablet (iPad, Android tablet)
  - [ ] Mobile (iPhone, Android phone)
- [ ] Check responsive design
- [ ] Verify localStorage works
- [ ] Test sound playback
- [ ] Build production bundle (`npm run build`)
- [ ] Test production build locally (`npm run preview`)

### Deployment to Vercel (Recommended)

Vercel automatically detects Vite projects and configures builds.

**Step 1: Prepare repository**
```bash
git init
git add .
git commit -m "Initial Flappy Bird game"
```

**Step 2: Push to GitHub**
```bash
git branch -M main
git remote add origin https://github.com/yourusername/flappy-bird.git
git push -u origin main
```

**Step 3: Deploy to Vercel**
- Visit https://vercel.com/new
- Import from GitHub
- Select the repository
- Vercel automatically detects Vite configuration
- Click "Deploy"

**Environment Variables** (if using Firebase):
- Add `VITE_FIREBASE_API_KEY=xxx` (public safe)
- Add other Firebase credentials as needed

**No source code changes needed** - Vercel handles everything!

### Deployment to Netlify

**Step 1: Connect repository**
```bash
npm i -g netlify-cli
netlify login
```

**Step 2: Deploy**
```bash
npm run build
netlify deploy --prod --dir=dist
```

**Alternative: Connect via Netlify UI**
- Visit https://app.netlify.com
- Click "New site from Git"
- Choose GitHub repository
- Build settings auto-detected (uses `npm run build`)
- Deploy

### Deployment to GitHub Pages

**Step 1: Update vite.config.ts**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/flappy-bird/', // Replace with your repo name
  plugins: [react()]
})
```

**Step 2: Add deploy script to package.json**
```json
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}
```

**Step 3: Install gh-pages**
```bash
npm install --save-dev gh-pages
```

**Step 4: Deploy**
```bash
npm run deploy
```

**Step 5: Update GitHub settings**
- Go to repository Settings → Pages
- Set "Source" to "Deploy from a branch"
- Select `gh-pages` branch
- Save

### Deployment to Traditional Hosting (cPanel, etc.)

**Step 1: Build locally**
```bash
npm run build
```

**Step 2: Upload to server**
- FTP/SFTP the contents of `dist/` folder to `public_html/` (or equivalent)
- Delete old application files first

**Step 3: Configure web server**

For Apache servers, create `.htaccess` in root:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

For Nginx servers, configure server block:
```nginx
server {
  listen 80;
  server_name yourdomain.com;
  root /path/to/dist;
  
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

**Step 4: Test**
- Visit your domain
- Test all game features
- Check browser console for errors

## Firebase Setup for Production Leaderboard

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: "flappy-bird-leaderboard"
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 2: Set Up Firestore Database

1. In Firebase console, click "Firestore Database"
2. Click "Create Database"
3. Start in test mode (for development)
4. Select region (closest to your users)
5. Click "Enable"

### Step 3: Configure Security Rules

1. Click "Rules" tab
2. Replace default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to read leaderboard
    match /leaderboard/{document=**} {
      allow read: if true;
      allow write: if false; // Disable direct writes
      allow create: if request.auth.uid != null; // For authenticated users
    }
    
    // For production, use email verification:
    // match /leaderboard/{document=**} {
    //   allow read: if true;
    //   allow create: if request.auth.token.email_verified == true;
    //   allow update: if resource.data.userId == request.auth.uid;
    //   allow delete: if false;
    // }
  }
}
```

4. Click "Publish"

### Step 4: Get Firebase Configuration

1. Click "Project Settings" (gear icon)
2. Under "General" tab, find "Your apps"
3. Click the web app (if none exists, click "Add app" and select web)
4. Copy the config object

### Step 5: Update Your Code

In `src/services/leaderboardService.ts`:

```typescript
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, where, updateDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Uncomment and use Firebase functions below...
```

### Step 6: Install Firebase SDK

```bash
npm install firebase
```

### Step 7: Test Locally

```bash
npm run dev
```

Play a game and verify leaderboard submissions work.

### Step 8: Switch to Production Rules

Before deploying, update rules for production authentication:

```javascript
match /leaderboard/{document=**} {
  allow read: if true;
  allow create: if request.auth.uid != null;
  allow update: if resource.data.userId == request.auth.uid;
  allow delete: if false;
}
```

## Cost Considerations

### Firebase (Free Tier)
- **Read operations**: 50,000/day (free)
- **Write operations**: 20,000/day (free)
- **Delete operations**: 20,000/day (free)
- **Stored data**: 1GB (free)
- **Bandwidth**: 1GB/month (free)

A game with 1,000 daily active users:
- ~1,500 reads/day (checking leaderboard)
- ~500 writes/day (submitting scores)
- Total: Well within free tier

### Hosting
- **Vercel**: Free tier includes 100GB bandwidth/month
- **Netlify**: Free tier includes 300 building minutes/month
- **GitHub Pages**: Completely free
- **Traditional hosting**: ~$5-15/month

## Post-Deployment Verification

After deploying:

1. **Smoke Test**
   - Load application
   - Register with test name
   - Select difficulty
   - Play a game
   - Check score submission

2. **Leaderboard Test**
   - Submit multiple scores
   - Verify leaderboard updates
   - Check rankings are correct

3. **Performance Test**
   - Check page load time (<3 seconds)
   - Monitor in Firefox DevTools Performance tab
   - Ensure 60FPS during gameplay

4. **Cross-Browser Test**
   - Chrome/Chromium
   - Firefox
   - Safari
   - Edge

5. **Mobile Test**
   - Portrait and landscape modes
   - Touch controls working
   - Proper scaling on various sizes

## Troubleshooting Deployment

### Build fails with "Cannot find module"
- Run `npm install` again
- Clear node_modules: `rm -rf node_modules && npm install`
- Verify all .ts files are created

### Page shows 404 after deployment
- Check if your hosting requires `index.html` rewrite
- Configure `.htaccess` or nginx rules (see sections above)
- Verify `dist/` folder contains `index.html`

### Firebase not working after deployment
- Verify Firebase credentials are correct
- Check Firestore rules allow public reads/writes
- Verify sound URLs load (check Network tab)
- Check browser console for CORS errors

### Game feels sluggish after deployment
- Check hosting has adequate bandwidth
- Clear browser cache
- Test with different browser
- Verify CDN is serving static assets

### High scores not saving
- Check localStorage is enabled in user's browser
- For Firebase: verify rules are published correctly
- Check browser console for errors
- Try incognito/private mode

## Rollback Plan

Keep previous `dist` folder as backup:

```bash
# Before new deploy
cp -r dist dist.backup

# If deployment has issues
cp -r dist.backup dist

# Redeploy the backup
netlify deploy --prod --dir=dist
```

## Monitoring

### Analytics to Track
- Daily active users
- Average game duration
- Score distribution
- Most popular difficulty

### Firebase Console Metrics
- Query performance
- Storage usage
- Error rates
- Data bandwidth

### Tools
- Google Analytics (add to `index.html`)
- Vercel Analytics (automatic)
- Netlify Analytics (automatic)
- Firebase Console (built-in)

---

**Deployment Support**: Check console errors with F12 → Console tab for detailed messages.
