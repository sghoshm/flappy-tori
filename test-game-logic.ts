import {
  initializeGame,
  updateGameLogic,
  flap,
  isCollide,
  FPS,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PIPE_WIDTH,
  PIPE_HEIGHT
} from './src/gameLogic'

// Test 1: Initialize game state
console.log('=== Test 1: Initialize Game ===')
let gameState = initializeGame()
console.log('Initial state:', gameState)
console.log('Player position:', gameState.playerX, gameState.playerY)
console.log('Player velocity:', gameState.playerVelY)
console.log('Passes:', gameState.playerX === Math.floor(SCREEN_WIDTH / 5) ? '✓' : '✗')

// Test 2: Gravity effect
console.log('\n=== Test 2: Gravity Effect ===')
for (let i = 0; i < 3; i++) {
  gameState = updateGameLogic(gameState)
}
console.log('Player Y after 3 frames:', gameState.playerY)
console.log('Player velocity:', gameState.playerVelY)
console.log('Velocity increased (gravity):', gameState.playerVelY > -9 ? '✓' : '✗')

// Test 3: Flap
console.log('\n=== Test 3: Flap ===')
const beforeFlap = gameState.playerVelY
gameState = flap(gameState)
console.log('Velocity before flap:', beforeFlap)
console.log('Velocity after flap:', gameState.playerVelY)
console.log('Flapped correctly:', gameState.playerVelY === -8 ? '✓' : '✗')

// Test 4: Pipes spawn
console.log('\n=== Test 4: Pipe Spawning ===')
gameState = initializeGame()
for (let i = 0; i < 120; i++) {
  gameState = updateGameLogic(gameState)
}
console.log('Pipes after 120 frames:', gameState.upperPipes.length, gameState.lowerPipes.length)
console.log('Pipes spawned:', gameState.upperPipes.length > 0 ? '✓' : '✗')

// Test 5: Pipe movement
console.log('\n=== Test 5: Pipe Movement ===')
if (gameState.upperPipes.length > 0) {
  const initialX = gameState.upperPipes[0].x
  gameState = updateGameLogic(gameState)
  const newX = gameState.upperPipes[0].x
  console.log('Initial X:', initialX)
  console.log('New X:', newX)
  console.log('Pipe moved left (X decreased by 4):', newX === initialX - 4 ? '✓' : '✗')
}

console.log('\n=== Tests Complete ===')
