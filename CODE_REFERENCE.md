# Code Architecture & API Reference

## Overview

This document explains the code structure, component APIs, and internal mechanics of the Flappy Bird game.

## Component Architecture

### App.tsx (Root Component)

**Purpose**: Main application orchestrator managing game state flow

**State**:
```typescript
type GameState = 'registration' | 'difficulty' | 'playing' | 'gameover' | 'leaderboard'

// State variables
playerName: string
difficulty: 'easy' | 'medium' | 'hard'
gameState: GameState
currentScore: number
highScore: number
```

**Key Functions**:
- `handleNameSubmit(name)`: Validates and stores player name
- `handleDifficultySelect(difficulty)`: Starts game with chosen difficulty
- `handleGameOver(score)`: Processes game end, updates high score
- `handleRestart()`: Returns to difficulty selection
- `handleViewLeaderboard()`: Shows leaderboard
- `handleBackFromLeaderboard()`: Returns to game over screen

**Flow**:
```
registration → difficulty → playing → gameover → leaderboard → gameover
```

---

## Components

### NameRegistration.tsx

**Props**:
```typescript
interface NameRegistrationProps {
  onSubmit: (name: string) => void
}
```

**Behavior**:
- Displays modal form
- Validates non-empty input
- Max 20 characters
- Clears error on input change

**Events**:
- Form submission calls `onSubmit(trimmedName)`
- Prevents submission of empty/whitespace-only names

---

### DifficultySelection.tsx

**Props**:
```typescript
interface DifficultySelectionProps {
  onSelect: (difficulty: Difficulty) => void
}
```

**Difficulty Data**:
```typescript
{
  level: 'easy' | 'medium' | 'hard'
  label: string
  description: string
}
```

**Events**:
- Button click calls `onSelect(level)`
- Updates parent state with selected difficulty

---

### GameScreen.tsx

**Props**:
```typescript
interface GameScreenProps {
  playerName: string
  difficulty: Difficulty
  highScore: number
  onGameOver: (score: number) => void
}
```

**Constants**:
```typescript
GAME_WIDTH = 800
GAME_HEIGHT = 600
BIRD_WIDTH = 30
BIRD_HEIGHT = 30
PIPE_WIDTH = 60
JUMP_STRENGTH = 12
```

**Physics Values** (by difficulty):
```typescript
MIN_GAP: { easy: 140, medium: 110, hard: 80 }
PIPE_SPEED: { easy: 3, medium: 5, hard: 7 }
GRAVITY: { easy: 0.4, medium: 0.6, hard: 0.8 }
```

**State**:
```typescript
birdY: number           // Bird's Y position
birdVelocity: number    // Bird's vertical speed
pipes: Pipe[]          // Active pipes
score: number          // Current game score
gameOver: boolean      // Game state
```

**Pipe Interface**:
```typescript
interface Pipe {
  id: number           // Unique identifier
  x: number            // Horizontal position
  gapY: number         // Top of gap position
  scored: boolean      // Whether score given
}
```

**Key Logic**:

1. **Game Loop** (requestAnimationFrame)
   - Updates bird position with gravity
   - Moves all pipes left
   - Spawns new pipes at intervals
   - Runs at ~60 FPS

2. **Input Handling**
   - Spacebar: `e.code === 'Space'`
   - Click: `onClick` handler on game-canvas div
   - Touch: Bubbles from click (same handler)

3. **Collision Detection**
   ```
   For each pipe:
     1. Check if bird is horizontally aligned
     2. Check if bird Y is outside gap
     3. If both true → collision → game over
   ```

4. **Scoring**
   ```
   When pipe.x + PIPE_WIDTH < bird.x (50):
     If not already scored:
       score++
       mark as scored
       play score sound
   ```

**Effects**:
- `useEffect` for game loop (cleanup on gameOver)
- `useEffect` for keyboard/touch listeners
- `useEffect` for collision detection
- `useEffect` for game over handling

---

### GameOverScreen.tsx

**Props**:
```typescript
interface GameOverScreenProps {
  playerName: string
  currentScore: number
  highScore: number
  onRestart: () => void
  onViewLeaderboard: () => void
}
```

**Features**:
- Displays both current and high scores
- Shows "New High Score!" message if applicable
- Provides "Play Again" and "View Leaderboard" buttons

---

### Leaderboard.tsx

**Props**:
```typescript
interface LeaderboardProps {
  playerName: string
  currentScore: number
  onBack: () => void
}
```

**Data Structure**:
```typescript
interface LeaderboardEntry {
  id?: string
  playerName: string
  score: number
  timestamp: number
}
```

**Features**:
- Auto-submits current score on mount
- Fetches top 10 scores
- Highlights current player's entry
- Shows player ranking
- Graceful fallback to demo data

---

## Services

### soundService.ts

**Sound URLs**:
```typescript
SOUND_URLS: {
  jump: string
  score: string
  gameover: string
}
```

**Functions**:

#### `playSound(soundKey)`
```typescript
playSound(soundKey: 'jump' | 'score' | 'gameover'): void
```
- Plays audio file
- Resets to beginning
- Catches and silently fails on errors
- Handles browser autoplay policy

#### `preloadSounds()`
```typescript
preloadSounds(): void
```
- Pre-loads all audio files
- Called on app startup (optional)

**Implementation Details**:
- Uses native `HTMLAudioElement`
- Caches audio objects for performance
- Handles autoplay policy gracefully
- Falls back silently if audio fails

---

### leaderboardService.ts

**Data Structure**:
```typescript
interface LeaderboardEntry {
  playerName: string
  score: number
  timestamp: number
}
```

**Functions**:

#### `submitScore(playerName, score)`
```typescript
async submitScore(
  playerName: string,
  score: number
): Promise<void>
```
- Submits score to leaderboard
- Updates if player already exists and score is higher
- Keeps top 100 scores
- Uses localStorage implementation by default

#### `getLeaderboard()`
```typescript
async getLeaderboard(): Promise<LeaderboardEntry[]>
```
- Fetches leaderboard
- Returns sorted by score (descending)
- Returns top 100 entries
- Implements localStorage by default

**Storage Implementation**:
```typescript
localStorage.getItem('flappyBirdLeaderboard')
localStorage.setItem('flappyBirdLeaderboard', JSON.stringify(data))
```

**Firebase Implementation** (commented):
- Uses Firestore `leaderboard` collection
- Document = individual score entry
- Fields: playerName, score, timestamp, userId
- Queries ordered by score, limited to 100

---

## Styling System

### Global Styles (index.css)
```css
* box-sizing: border-box
html, body: 100vh, overflow hidden
#root: full viewport
```

### App.css
```css
.app-container: flex column, full height
.app-header: dark gradient, gold bottom border
.app-main: flex center, position relative
```

### Component-Specific CSS
Each component has corresponding `.css` file with:
- Modal overlays (rgba, z-index)
- Gradient backgrounds
- Responsive breakpoints (768px, 480px)
- Animations (slideIn, pulse)
- Button styles
- Transition effects

---

## Type Definitions

### Difficulty Type
```typescript
export type Difficulty = 'easy' | 'medium' | 'hard'
```

### GameState Type
```typescript
export type GameState = 
  | 'registration'
  | 'difficulty'
  | 'playing'
  | 'gameover'
  | 'leaderboard'
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────┐
│         App.tsx (Root)                  │
│  - gameState                             │
│  - playerName                            │
│  - difficulty                            │
│  - currentScore                          │
│  - highScore (from localStorage)         │
└─────────────────────────────────────────┘
               ↓
    ┌──────────┼──────────┐
    ↓          ↓          ↓
┌─────────┐ ┌──────────┐ ┌───────────┐
│ Name    │ │Difficulty│ │ GameScreen│
│Reg.     │ │Selection │ │           │
└─────────┘ └──────────┘ └───────────┘
    ↓          ↓          ↓
    └──────────┼──────────┘
              ↓
    ┌──────────────────────┐
    │ GameOverScreen       │
    │ - Shows final score  │
    │ - Submits to leader. │
    └──────────────────────┘
              ↓
    ┌──────────────────────┐
    │ Leaderboard          │
    │ - Shows top 10       │
    │ - Player ranking     │
    └──────────────────────┘
              ↓
    ┌──────────────────────┐
    │ localStorage         │
    │ - High scores        │
    │ - Leaderboard data   │
    └──────────────────────┘
```

---

## Game Loop Implementation

**Timing**: Uses `requestAnimationFrame` for 60 FPS

**Order of Operations per Frame**:
1. Update bird Y with gravity
2. Check bird boundaries
3. Update all pipes position
4. Check spawn new pipe
5. Update state with new values
6. Check collision (separate effect)
7. Check scoring (separate effect)
8. Schedule next frame

**Cleanup**: Cancel animation frame on game over or unmount

---

## Event Handling

### Keyboard Events
```typescript
'keydown' event listener
e.code === 'Space' → handleJump()
e.preventDefault() to prevent browser default
Removed on component unmount
```

### Touch/Click Events
```typescript
onClick on .game-canvas div
Triggers handleJump()
Works on all devices (bubbles from touch)
```

---

## Performance Optimizations

1. **Audio Caching**: Pre-create audio elements
2. **State Batching**: Use single setState when possible
3. **Ref Usage**: Animation frame ID in ref (no re-render)
4. **Cleanup**: Remove listeners and cancel frames
5. **CSS Transforms**: GPU-accelerated positioning
6. **Debouncing**: Game state updates only on change

---

## Browser Compatibility

**Tested On**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**APIs Used**:
- `requestAnimationFrame`: All modern browsers
- `localStorage`: All modern browsers
- `HTMLAudioElement`: All modern browsers
- `KeyboardEvent.code`: All modern browsers
- `fetch`: All modern browsers (for Firebase)

---

## Common Modifications

### Change Bird Color
Edit `GameScreen.tsx`:
```typescript
const BIRD_SVG = `<svg>
  <circle cx="15" cy="15" r="12" fill="#NEW_COLOR"/>
  ...
</svg>`
```

### Adjust Difficulty
Edit `GameScreen.tsx` constants:
```typescript
const MIN_GAP = { easy: 200, ... }
const PIPE_SPEED = { easy: 2, ... }
const GRAVITY = { easy: 0.3, ... }
```

### Change Sound URLs
Edit `soundService.ts`:
```typescript
const SOUND_URLS = {
  jump: 'https://new-url.com/sound.wav',
  ...
}
```

### Add Firebase
Edit `leaderboardService.ts`:
1. Uncomment Firebase section
2. Add your credentials
3. Comment out localStorage section
4. `npm install firebase`

### Custom Theme Colors
Edit component `.css` files:
```css
.registration-modal {
  background: linear-gradient(135deg, #NEW_COLOR1, #NEW_COLOR2);
}
```

---

## Testing the Game

### Manual Test Cases

**Registration**:
- [ ] Empty name rejected
- [ ] Long name truncated
- [ ] Valid name accepted
- [ ] Moves to difficulty screen

**Difficulty**:
- [ ] All buttons clickable
- [ ] Correct difficulty selected
- [ ] Game starts immediately

**Gameplay**:
- [ ] Bird falls with gravity
- [ ] Jump works (click, touch, spacebar)
- [ ] Pipes generate at intervals
- [ ] Collision detection accurate
- [ ] Score increments correctly
- [ ] Game over triggers on collision

**Game Over**:
- [ ] Correct score displayed
- [ ] High score updated if beaten
- [ ] Leaderboard button works
- [ ] Restart button works

**Leaderboard**:
- [ ] Scores displayed
- [ ] Sorted correctly
- [ ] Player highlighted
- [ ] Rank shown
- [ ] Back button works

---

## Debugging Tips

### Enable Debug Logging
Add to `GameScreen.tsx`:
```typescript
console.log(`Bird Y: ${birdY}, Velocity: ${birdVelocity}`)
console.log(`Pipes: ${pipes.length}, Score: ${score}`)
```

### Check Game State
In browser DevTools Console:
```javascript
// Check localStorage
localStorage.getItem('flappyBirdHighScore')
localStorage.getItem('flappyBirdLeaderboard')

// Check audio elements
window.audioCache // (if accessible)
```

### Monitor Performance
In browser DevTools Performance tab:
- Record gameplay
- Check FPS (should be ~60)
- Identify stalls or drops
- Look for memory leaks

---

**Last Updated**: February 2026
**Version**: 1.0.0
