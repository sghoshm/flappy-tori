// --- GLOBAL CONSTANTS ---
export const FPS = 32

// The original game was written for a portrait "design resolution".
// We keep these as a baseline, but run the actual game in pixel space
// so the playable area can fill any screen size/aspect ratio.
const DESIGN_WIDTH = 289
const DESIGN_HEIGHT = 511

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface GameConfig {
  width: number
  height: number
  groundY: number
  pipeWidth: number
  pipeHeight: number
  baseHeight: number
  playerWidth: number
  playerHeight: number
  pipeVelX: number
  playerMaxVelY: number
  playerAccY: number
  playerFlapAcc: number
  initialPlayerVelY: number
  difficulty: Difficulty
}

export function createGameConfig(
  width: number,
  height: number,
  difficulty: Difficulty = 'medium'
): GameConfig {
  const safeWidth = Math.max(280, Math.floor(width))
  const safeHeight = Math.max(280, Math.floor(height))

  // Uniform scale so sprites don't look stretched or too "fat".
  const baseScale = Math.min(safeWidth / DESIGN_WIDTH, safeHeight / DESIGN_HEIGHT)

  let speedMultiplier = 1
  let gapMultiplier = 1

  if (difficulty === 'easy') {
    speedMultiplier = 0.8
    gapMultiplier = 1.3
  } else if (difficulty === 'hard') {
    speedMultiplier = 1.4
    gapMultiplier = 0.75
  }

  return {
    width: safeWidth,
    height: safeHeight,
    groundY: safeHeight * 0.8,
    pipeWidth: 52 * baseScale,
    pipeHeight: 320 * baseScale,
    baseHeight: 112 * baseScale * gapMultiplier,
    playerWidth: 34 * baseScale,
    playerHeight: 24 * baseScale,
    pipeVelX: -4 * baseScale * speedMultiplier,
    playerMaxVelY: 10 * baseScale * speedMultiplier,
    playerAccY: 1 * baseScale * speedMultiplier,
    playerFlapAcc: -8 * baseScale * speedMultiplier,
    initialPlayerVelY: -9 * baseScale,
    difficulty
  }
}

// --- GAME STATE ---
export interface GameState {
  playerX: number;
  playerY: number;
  playerVelY: number;
  playerFlapped: boolean;
  upperPipes: Pipe[];
  lowerPipes: Pipe[];
  score: number;
  gameOver: boolean;
  frameTime: number;
}

export interface Pipe {
  x: number;
  y: number;
  scored?: boolean;
}

// --- INITIALIZE GAME STATE ---
export function initializeGame(config: GameConfig): GameState {
  return {
    playerX: Math.floor(config.width / 5),
    playerY: Math.floor(config.height * 0.4),
    playerVelY: config.initialPlayerVelY,
    playerFlapped: false,
    upperPipes: [],
    lowerPipes: [],
    score: 0,
    gameOver: false,
    frameTime: 0
  };
}

// --- RANDOM PIPE GENERATOR (EXACT PYTHON FORMULA) ---
export function getRandomPipe(config: GameConfig): [Pipe, Pipe] {
  const offset = config.height / 3

  const minUpperY = -config.pipeHeight + 60 // at least some visible from top
  const maxUpperY = -(offset + 50)
  const upperY = minUpperY + Math.floor(Math.random() * (maxUpperY - minUpperY));
  const lowerY = upperY + config.pipeHeight + config.baseHeight; // gap of baseHeight

  const pipeX = config.width + 10;

  return [
    { x: pipeX, y: upperY }, // upper pipe
    { x: pipeX, y: lowerY }  // lower pipe with guaranteed BASE_HEIGHT gap
  ];
}

// --- INPUT: FLAP ---
export function flap(state: GameState, config: GameConfig): GameState {
  if (state.playerY > 0) {
    return {
      ...state,
      playerVelY: config.playerFlapAcc,
      playerFlapped: true
    };
  }
  return state;
}

// --- COLLISION DETECTION ---
export function isCollide(
  playerX: number,
  playerY: number,
  upperPipes: Pipe[],
  lowerPipes: Pipe[],
  config: GameConfig
): boolean {
  const scaleY = config.height / DESIGN_HEIGHT
  if (playerY > config.groundY - 25 * scaleY || playerY < 0) {
    return true;
  }

  for (const pipe of upperPipes) {
    if (
      playerY < config.pipeHeight + pipe.y &&
      Math.abs(playerX - pipe.x) < config.pipeWidth
    ) {
      return true;
    }
  }

  for (const pipe of lowerPipes) {
    if (
      playerY + config.playerHeight > pipe.y &&
      Math.abs(playerX - pipe.x) < config.pipeWidth
    ) {
      return true;
    }
  }

  return false;
}

// --- SCORING LOGIC ---
export function updateScore(
  state: GameState,
  config: GameConfig
): { newState: GameState; scoreIncremented: boolean } {
  let scoreIncremented = false;
  const playerMidPos = state.playerX + config.playerWidth / 2;
  let newScore = state.score;

  for (const pipe of state.upperPipes) {
    const pipeMidPos = pipe.x + config.pipeWidth / 2;
    const tolerance = 4 * (config.width / DESIGN_WIDTH);
    if (pipeMidPos <= playerMidPos && pipeMidPos + tolerance > playerMidPos) {
      if (!pipe.scored) {
        newScore += 1;
        scoreIncremented = true;
        pipe.scored = true;
      }
    }
  }

  return {
    newState: { ...state, score: newScore },
    scoreIncremented
  };
}

// --- GAME LOGIC UPDATE (FRAME-BASED) ---
export function updateGameLogic(state: GameState, config: GameConfig): GameState {
  if (state.gameOver) return state;

  // Player physics
  let newVelY = state.playerVelY;
  if (newVelY < config.playerMaxVelY && !state.playerFlapped) {
    newVelY += config.playerAccY;
  }

  let playerFlapped = state.playerFlapped;
  if (playerFlapped) {
    playerFlapped = false;
  }

  const newPlayerY =
    state.playerY + Math.min(newVelY, config.groundY - state.playerY - config.playerHeight);

  // Pipe movement
  const newUpperPipes = state.upperPipes.map(pipe => ({
    ...pipe,
    x: pipe.x + config.pipeVelX,
    scored: pipe.scored ?? false
  }));
  const newLowerPipes = state.lowerPipes.map(pipe => ({
    ...pipe,
    x: pipe.x + config.pipeVelX
  }));

  // Pipe spawn (every 3.4 seconds at 32 FPS)
  if (
    state.upperPipes.length === 0 ||
    newUpperPipes[newUpperPipes.length - 1].x < config.width * (1 - 55 / DESIGN_WIDTH)
  ) {
    const [upper, lower] = getRandomPipe(config);
    newUpperPipes.push({ ...upper, scored: false });
    newLowerPipes.push(lower);
  }

  // Pipe removal
  if (newUpperPipes.length && newUpperPipes[0].x < -config.pipeWidth) {
    newUpperPipes.shift();
    newLowerPipes.shift();
  }

  // Scoring
  const { newState: stateWithScore } = updateScore(
    {
      ...state,
      playerY: newPlayerY,
      playerVelY: newVelY,
      playerFlapped,
      upperPipes: newUpperPipes,
      lowerPipes: newLowerPipes
    },
    config
  );

  // Collision
  const collision = isCollide(state.playerX, newPlayerY, newUpperPipes, newLowerPipes, config);

  return {
    ...stateWithScore,
    gameOver: collision
  };
}
