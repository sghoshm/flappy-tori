import { useState, useEffect, useRef } from 'react'
import './App.css'
import type { GameState, GameConfig, Difficulty } from './gameLogic'
import {
  initializeGame,
  updateGameLogic,
  flap,
  FPS,
  createGameConfig
} from './gameLogic'

function App() {
  const containerRef = useRef<HTMLElement | null>(null)
  const hudRef = useRef<HTMLDivElement | null>(null)
  const gameCanvasRef = useRef<HTMLDivElement | null>(null)

  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const gameConfigRef = useRef<GameConfig>(createGameConfig(600, 600, 'medium'))
  const [gameConfig, setGameConfig] = useState<GameConfig>(gameConfigRef.current)

  const [gameState, setGameState] = useState<GameState>(() => initializeGame(gameConfigRef.current))
  const [started, setStarted] = useState(false)
  const [playerName, setPlayerName] = useState('Player1')
  const [showNameModal, setShowNameModal] = useState(true)
  const [highScore, setHighScore] = useState(0)
  type LeaderboardEntry = { name: string; score: number }
  const defaultLeaderboard: LeaderboardEntry[] = [
    { name: 'Player2', score: 30 },
    { name: 'Player3', score: 25 },
    { name: 'Player4', score: 18 }
  ]
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(defaultLeaderboard)
  const [canvasWidth, setCanvasWidth] = useState(600)
  const [canvasHeight, setCanvasHeight] = useState(600)
  const gameLoopRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef(0)
  const frameIntervalRef = useRef(1000 / FPS)

  const scaleGameStateToConfig = (state: GameState, from: GameConfig, to: GameConfig): GameState => {
    if (from.width === to.width && from.height === to.height) return state

    const sx = to.width / from.width
    const sy = to.height / from.height

    return {
      ...state,
      playerX: state.playerX * sx,
      playerY: state.playerY * sy,
      playerVelY: state.playerVelY * sy,
      upperPipes: state.upperPipes.map((p) => ({ ...p, x: p.x * sx, y: p.y * sy })),
      lowerPipes: state.lowerPipes.map((p) => ({ ...p, x: p.x * sx, y: p.y * sy }))
    }
  }

  // Load high score and calculate responsive canvas size
  useEffect(() => {
    const saved = localStorage.getItem('flappyBirdHighScore')
    if (saved) setHighScore(parseInt(saved, 10))

    const lbSaved = localStorage.getItem('flappyBirdLeaderboard')
    if (lbSaved) {
      try {
        const parsed = JSON.parse(lbSaved) as LeaderboardEntry[]
        if (Array.isArray(parsed) && parsed.every((e) => typeof e?.name === 'string' && typeof e?.score === 'number')) {
          setLeaderboard(parsed)
        } else {
          localStorage.setItem('flappyBirdLeaderboard', JSON.stringify(defaultLeaderboard))
          setLeaderboard(defaultLeaderboard)
        }
      } catch {
        localStorage.setItem('flappyBirdLeaderboard', JSON.stringify(defaultLeaderboard))
        setLeaderboard(defaultLeaderboard)
      }
    } else {
      localStorage.setItem('flappyBirdLeaderboard', JSON.stringify(defaultLeaderboard))
      setLeaderboard(defaultLeaderboard)
    }

    // Observe the actual canvas element size so the game area matches
    // the center (red rectangle) exactly and stays responsive.
    const el = gameCanvasRef.current
    if (!el) return

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return

      const nextWidth = Math.floor(entry.contentRect.width)
      const nextHeight = Math.floor(entry.contentRect.height)
      if (nextWidth <= 0 || nextHeight <= 0) return

      const prevConfig = gameConfigRef.current
      const nextConfig = createGameConfig(nextWidth, nextHeight, difficulty)

      gameConfigRef.current = nextConfig
      setGameConfig(nextConfig)
      setCanvasWidth(nextConfig.width)
      setCanvasHeight(nextConfig.height)
      setGameState((prev) => scaleGameStateToConfig(prev, prevConfig, nextConfig))
    })

    ro.observe(el)
    return () => ro.disconnect()
  }, [difficulty])

  // Handle name submit
  const handleNameSubmit = (name: string) => {
    setPlayerName(name)
  }

  // Handle difficulty select
  const handleDifficultySelect = (level: Difficulty) => {
    setDifficulty(level)
    const nextConfig = createGameConfig(canvasWidth, canvasHeight, level)
    gameConfigRef.current = nextConfig
    setGameConfig(nextConfig)
    setShowNameModal(false)
    setGameState(initializeGame(nextConfig))
    setStarted(false)
  }

  // Handle flap
  const handleFlap = () => {
    if (!started) {
      setStarted(true)
      return
    }
    if (!gameState.gameOver) {
      setGameState((prev) => flap(prev, gameConfigRef.current))
    }
  }

  // Game loop
  useEffect(() => {
    if (showNameModal || !started) return

    const animate = (timestamp: number) => {
      if (timestamp - lastFrameTimeRef.current >= frameIntervalRef.current) {
        setGameState((prev) => updateGameLogic(prev, gameConfigRef.current))
        lastFrameTimeRef.current = timestamp
      }
      gameLoopRef.current = requestAnimationFrame(animate)
    }

    gameLoopRef.current = requestAnimationFrame(animate)

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current)
    }
  }, [started, showNameModal])

  // Handle game over
  useEffect(() => {
    if (gameState.gameOver && started) {
      if (gameState.score > highScore) {
        setHighScore(gameState.score)
        localStorage.setItem('flappyBirdHighScore', gameState.score.toString())
      }

      // Update local "global" leaderboard (no backend): insert this run and keep top scores.
      const current: LeaderboardEntry = { name: playerName.trim() || 'Player', score: gameState.score }
      setLeaderboard((prev) => {
        const next = [...prev, current]
          .filter((e) => e.score > 0 && e.name.length > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)

        localStorage.setItem('flappyBirdLeaderboard', JSON.stringify(next))
        return next
      })
    }
  }, [gameState.gameOver, gameState.score, highScore, started, playerName])

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        handleFlap()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [started, gameState.gameOver])

  const handleRestart = () => {
    setGameState(initializeGame(gameConfigRef.current))
    setStarted(false)
  }

  const handleNameAgain = () => {
    setShowNameModal(true)
    setGameState(initializeGame(gameConfigRef.current))
    setStarted(false)
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Made by Sumon Sourabh Ghosh</h1>
      </header>

      <main className="game-container" ref={containerRef}>
        <div className="game-grid">
          <div className="game-header" ref={hudRef}>
            <span className="player-name">{playerName}</span>
            <span className="score">Score: {gameState.score}</span>
            <span className="high-score">Best: {highScore}</span>
          </div>

          {/* Scoreboard */}
          <div className="scoreboard">
            <div className="scoreboard-header">Scoreboard</div>
            <div className="scoreboard-body">
              <div>Score: <strong>{gameState.score}</strong></div>
              <div>Best: <strong>{highScore}</strong></div>
            </div>
          </div>

          <div
            className="game-canvas"
            ref={gameCanvasRef}
            onClick={handleFlap}
            role="button"
            tabIndex={0}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              background: `linear-gradient(to bottom, #1e90ff 0%, #87CEEB 60%, #E0F6FF 88%, #90EE90 100%)`,
              border: '3px solid #333',
              margin: 0,
              overflow: 'hidden',
              touchAction: 'manipulation'
            }}
          >
          {/* Bird */}
          <div
            className="bird"
            style={{
              position: 'absolute',
              left: gameState.playerX,
              top: gameState.playerY,
              width: gameConfig.playerWidth,
              height: gameConfig.playerHeight,
              zIndex: 10
            }}
          >
            <img
              src="/bird.png"
              alt="Bird"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
                pointerEvents: 'none',
                userSelect: 'none'
              }}
            />
          </div>

          {/* Upper pipes */}
          {gameState.upperPipes.map((pipe, idx) => (
            <div
              key={`upper-${idx}`}
              style={{
                position: 'absolute',
                left: pipe.x,
                top: pipe.y,
                width: gameConfig.pipeWidth,
                height: gameConfig.pipeHeight,
                background: 'linear-gradient(to right, #228B22 0%, #32CD32 50%, #228B22 100%)',
                border: '2px solid #000',
                boxSizing: 'border-box'
              }}
            />
          ))}

          {/* Lower pipes */}
          {gameState.lowerPipes.map((pipe, idx) => (
            <div
              key={`lower-${idx}`}
              style={{
                position: 'absolute',
                left: pipe.x,
                top: pipe.y,
                width: gameConfig.pipeWidth,
                height: Math.max(0, canvasHeight - pipe.y),
                background: 'linear-gradient(to right, #228B22 0%, #32CD32 50%, #228B22 100%)',
                border: '2px solid #000',
                boxSizing: 'border-box'
              }}
            />
          ))}

          {/* Game instructions */}
          {!started && !gameState.gameOver && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '20px 40px',
                borderRadius: '8px',
                textAlign: 'center',
                zIndex: 100
              }}
            >
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Click or Press Space to Jump</p>
            </div>
          )}

          {/* Game Over */}
          {gameState.gameOver && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '30px 40px',
                borderRadius: '8px',
                textAlign: 'center',
                zIndex: 100
              }}
            >
              <h2 style={{ margin: '0 0 10px 0' }}>Game Over!</h2>
              <p style={{ margin: '0 0 5px 0', fontSize: '18px' }}>Score: {gameState.score}</p>
              <p style={{ margin: '0 0 20px 0', fontSize: '16px' }}>Best: {highScore}</p>
              <button
                onClick={handleRestart}
                style={{
                  padding: '10px 20px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                Play Again
              </button>
              <button
                onClick={handleNameAgain}
                style={{
                  padding: '10px 20px',
                  background: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Change Name
              </button>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="leaderboard">
          <div className="leaderboard-header">Global Leaderboard</div>
          <ol className="leaderboard-list">
            {leaderboard.map((e) => (
              <li key={`${e.name}-${e.score}`}>{e.name} - {e.score}</li>
            ))}
          </ol>
        </div>
        </div>
      </main>

      {/* Name & Difficulty Modal */}
      {showNameModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Enter Your Name to Play!</h2>
            <label>Your Name:</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              autoFocus
              maxLength={20}
            />
            <button onClick={() => handleNameSubmit(playerName)}>Start</button>
          </div>

          <div className="difficulty-panel">
            <h3>Choose Difficulty:</h3>
            <div className="difficulty-buttons">
              <button className="difficulty-btn easy" onClick={() => handleDifficultySelect('easy')}>Easy</button>
              <button className="difficulty-btn medium" onClick={() => handleDifficultySelect('medium')}>Medium</button>
              <button className="difficulty-btn hard" onClick={() => handleDifficultySelect('hard')}>Hard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
