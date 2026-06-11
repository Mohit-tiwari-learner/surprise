"use client";

import React, { useState, useEffect, useRef } from "react";
import { Heart, Sparkles, ChevronRight, RotateCcw, Trophy, CheckCircle, AlertCircle, Info } from "lucide-react";
import { synth } from "./AudioSynth";

interface FallingWord {
  id: number;
  text: string;
  x: number; // Percentage 15 - 85
  y: number; // Percentage 0 - 100
  speed: number;
  rotation: number;
  rotDir: number;
  isCorrect: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number; // 0 to 1
  type: "heart" | "sparkle" | "fragment";
}

interface ComboFloat {
  id: number;
  text: string;
  x: number;
  y: number;
  isError: boolean;
  age: number; // in frames (0 to 60)
}

interface LoveCatchGameProps {
  onComplete: () => void;
  muted: boolean;
}

// Phrases divided by Phase
const PHASE_CONFIG: Record<number, {
  words: string[];
  spawnInterval: number;
  speed: [number, number];
  distractorCount: number;
}> = {
  1: { words: ["You", "are", "my"], spawnInterval: 1550, speed: [0.6, 0.85], distractorCount: 1 },
  2: { words: ["entire", "universe"], spawnInterval: 1250, speed: [0.85, 1.25], distractorCount: 2 },
  3: { words: ["and", "forever", "will", "be"], spawnInterval: 950, speed: [1.15, 1.65], distractorCount: 3 },
};

const TARGET_WORDS = ["You", "are", "my", "entire", "universe", "and", "forever", "will", "be"];
const DISTRACTOR_POOL = ["maybe", "sometimes", "almost", "never", "partly", "kinda", "barely", "slightly", "just", "only"];

export default function LoveCatchGame({ onComplete, muted }: LoveCatchGameProps) {
  // Game states for rendering
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [wordIndex, setWordIndex] = useState(0); // Index within current phase
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [gameState, setGameState] = useState<"intro" | "playing" | "phase-transition" | "victory" | "game-over">("intro");
  const [assembledWords, setAssembledWords] = useState<string[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);

  // States synchronized at the end of each physics frame
  const [fallingWords, setFallingWords] = useState<FallingWord[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [comboFloats, setComboFloats] = useState<ComboFloat[]>([]);

  // Position & tilt states
  const [catcherX, setCatcherX] = useState(50); // percentage 5 - 95
  const [tilt, setTilt] = useState(0);
  const arenaRef = useRef<HTMLDivElement>(null);

  // Animation frame references
  const gameLoopRef = useRef<number | null>(null);
  const lastSpawnRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // Refs for physics engine updates
  const fallingWordsRef = useRef<FallingWord[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const comboFloatsRef = useRef<ComboFloat[]>([]);
  const catcherXRef = useRef(50);
  const prevXRef = useRef(50);

  // Refs for gameplay rules and state machine
  const phaseRef = useRef<1 | 2 | 3>(1);
  const wordIndexRef = useRef(0);
  const livesRef = useRef(3);
  const comboRef = useRef(0);
  const gameStateRef = useRef<"intro" | "playing" | "phase-transition" | "victory" | "game-over">("intro");

  // Feedback states
  const [flashType, setFlashType] = useState<"red" | "pink" | null>(null);
  const [shake, setShake] = useState(false);

  // Keep refs in sync
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { wordIndexRef.current = wordIndex; }, [wordIndex]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { catcherXRef.current = catcherX; }, [catcherX]);

  // Clean up loop on unmount
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, []);

  // Sync previous catcher position and decay tilt
  useEffect(() => {
    const decay = setInterval(() => {
      setTilt((t) => (Math.abs(t) < 0.1 ? 0 : t * 0.82));
    }, 30);
    return () => clearInterval(decay);
  }, []);

  // Reset physics objects when transitioning to screens
  useEffect(() => {
    if (gameState !== "playing") {
      fallingWordsRef.current = [];
      particlesRef.current = [];
      comboFloatsRef.current = [];
      setFallingWords([]);
      setParticles([]);
      setComboFloats([]);
    }
  }, [gameState]);

  // Synchronous particle bursts (runs inside the physics updates)
  const spawnParticleBurstSync = (x: number, y: number, type: "heart" | "sparkle" | "fragment", count: number) => {
    const colors = 
      type === "heart" 
        ? ["text-pink-500", "text-rose-500", "text-pink-400", "text-rose-450"]
        : type === "sparkle"
        ? ["text-amber-400", "text-yellow-300", "text-orange-400"]
        : ["text-zinc-400", "text-zinc-500", "text-zinc-650"];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 3.5;
      particlesRef.current.push({
        id: Math.random() + Date.now() + i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5, // subtle upwards lift
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0,
        type
      });
    }
  };

  // Phase transition advancement
  const handlePhaseCompleteSync = () => {
    const currentPhase = phaseRef.current;
    if (currentPhase < 3) {
      setGameState("phase-transition");
      if (!muted) {
        synth.playAccessGrantedChime();
      }

      setTimeout(() => {
        const nextPhase = (currentPhase + 1) as 1 | 2 | 3;
        setPhase(nextPhase);
        setWordIndex(0);
        wordIndexRef.current = 0;
        setGameState("playing");
      }, 2000);
    } else {
      // Victory achieved!
      const timeSpent = Math.floor((performance.now() - startTimeRef.current) / 1000);
      setElapsedTime(timeSpent);
      setGameState("victory");
      if (!muted) {
        synth.playProposalSuccessMagic();
      }
    }
  };

  // Process word catching logic synchronously inside the frame tick
  const handleCatchSync = (word: FallingWord) => {
    if (gameStateRef.current !== "playing") return;

    if (word.isCorrect) {
      // Correct Catch!
      const nextCombo = comboRef.current + 1;
      comboRef.current = nextCombo;
      setCombo(nextCombo);
      setMaxCombo((mc) => Math.max(mc, nextCombo));
      
      if (!muted) {
        synth.playCatchChime(nextCombo);
      }
      
      // Spawn floating combo text
      comboFloatsRef.current.push({
        id: Math.random() + Date.now(),
        text: `Combo ×${nextCombo}!`,
        x: word.x,
        y: 80,
        isError: false,
        age: 0
      });

      setFlashType("pink");
      setTimeout(() => setFlashType(null), 300);

      // Trigger particle burst at the catch zone
      spawnParticleBurstSync(word.x, 85, "heart", 12);

      // Add word to list of caught/assembled words
      setAssembledWords((prev) => [...prev, word.text]);

      const targetWords = PHASE_CONFIG[phaseRef.current].words;
      const nextIdx = wordIndexRef.current + 1;
      wordIndexRef.current = nextIdx;
      setWordIndex(nextIdx);

      if (nextIdx >= targetWords.length) {
        handlePhaseCompleteSync();
      }
    } else {
      // Wrong Catch!
      comboRef.current = 0;
      setCombo(0);

      const nextLives = livesRef.current - 1;
      livesRef.current = nextLives;
      setLives(nextLives);

      comboFloatsRef.current.push({
        id: Math.random() + Date.now(),
        text: "Tangled! 💔",
        x: word.x,
        y: 80,
        isError: true,
        age: 0
      });

      setShake(true);
      setTimeout(() => setShake(false), 350);

      setFlashType("red");
      setTimeout(() => setFlashType(null), 300);

      // Distractor shatter effect
      spawnParticleBurstSync(word.x, 85, "fragment", 8);

      if (!muted) {
        synth.playWarningAlert();
      }

      if (nextLives <= 0) {
        setGameState("game-over");
      }
    }
  };

  // Main active gameplay loop using the high-performance ref engine
  useEffect(() => {
    if (gameState !== "playing") {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    lastSpawnRef.current = performance.now();

    const update = (time: number) => {
      // 1. Spawning calculations
      const config = PHASE_CONFIG[phaseRef.current];
      if (time - lastSpawnRef.current > config.spawnInterval) {
        lastSpawnRef.current = time;

        const hasCorrect = fallingWordsRef.current.some((w) => w.isCorrect);
        let wordToSpawn = "";
        let isCorrect = false;

        const targetWords = config.words;
        
        if (!hasCorrect && wordIndexRef.current < targetWords.length) {
          wordToSpawn = targetWords[wordIndexRef.current];
          isCorrect = true;
        } else {
          // Count current distractors on screen
          const distCount = fallingWordsRef.current.filter((w) => !w.isCorrect).length;
          if (distCount < config.distractorCount) {
            const distPool = DISTRACTOR_POOL;
            wordToSpawn = distPool[Math.floor(Math.random() * distPool.length)];
            isCorrect = false;
          }
        }

        // Spawn if we determined a valid word
        if (wordToSpawn) {
          const speedRange = config.speed;
          const speed = speedRange[0] + Math.random() * (speedRange[1] - speedRange[0]);

          fallingWordsRef.current.push({
            id: Math.random() + Date.now(),
            text: wordToSpawn,
            x: 15 + Math.random() * 70, // Keep in bounds
            y: 0,
            speed: speed,
            rotation: 0,
            rotDir: Math.random() > 0.5 ? 1 : -1,
            isCorrect
          });
        }
      }

      // 2. Physics check: Update falling word coordinates & check collisions
      const nextFallingWords: FallingWord[] = [];
      fallingWordsRef.current.forEach((word) => {
        const nextY = word.y + word.speed;

        // Spawn a trail particle behind the correct next word periodically
        if (word.isCorrect && Math.random() < 0.14) {
          const colors = ["text-pink-300/40", "text-rose-300/40"];
          particlesRef.current.push({
            id: Math.random() + Date.now() + Math.random(),
            x: word.x + (Math.random() - 0.5) * 4,
            y: nextY + 2,
            vx: (Math.random() - 0.5) * 0.4,
            vy: 0.2 + Math.random() * 0.4,
            size: 2 + Math.random() * 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 0.7,
            type: "sparkle"
          });
        }

        // Catcher collision box (y between 83% and 90%)
        if (nextY >= 83 && nextY <= 90) {
          const distance = Math.abs(word.x - catcherXRef.current);
          const threshold = word.isCorrect ? 14 : 10;

          if (distance < threshold) {
            handleCatchSync(word);
            return; // Remove from falling list
          }
        }

        if (nextY < 100) {
          nextFallingWords.push({ ...word, y: nextY });
        }
      });
      fallingWordsRef.current = nextFallingWords;

      // 3. Particle updates
      const nextParticles: Particle[] = [];
      particlesRef.current.forEach((p) => {
        const nextLife = p.life - 0.025; // decays over 40 frames (~0.6s)
        if (nextLife > 0) {
          nextParticles.push({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.12, // gravity
            vx: p.vx * 0.97, // air resistance drag
            life: nextLife
          });
        }
      });
      particlesRef.current = nextParticles;

      // 4. Update floating indicators physics
      const nextFloats: ComboFloat[] = [];
      comboFloatsRef.current.forEach((float) => {
        const nextAge = float.age + 1.25;
        if (nextAge < 50) { // live for ~40 frames (~0.65s)
          nextFloats.push({
            ...float,
            y: float.y - 0.65, // slide upwards
            age: nextAge
          });
        }
      });
      comboFloatsRef.current = nextFloats;

      // 5. Synchronize all updated objects to React states for rendering in one atomic cycle
      setFallingWords([...fallingWordsRef.current]);
      setParticles([...particlesRef.current]);
      setComboFloats([...comboFloatsRef.current]);

      gameLoopRef.current = requestAnimationFrame(update);
    };

    gameLoopRef.current = requestAnimationFrame(update);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [gameState, muted]);

  // Touch and drag handlers for mobile responsive compatibility
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!arenaRef.current || gameStateRef.current !== "playing") return;
    const rect = arenaRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const pct = (relativeX / rect.width) * 100;
    
    const diff = pct - prevXRef.current;
    setTilt(Math.max(-14, Math.min(14, diff * 1.8)));
    
    setCatcherX(Math.max(5, Math.min(95, pct)));
    prevXRef.current = pct;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!arenaRef.current || gameStateRef.current !== "playing" || e.touches.length === 0) return;
    const rect = arenaRef.current.getBoundingClientRect();
    const relativeX = e.touches[0].clientX - rect.left;
    const pct = (relativeX / rect.width) * 100;
    
    const diff = pct - prevXRef.current;
    setTilt(Math.max(-14, Math.min(14, diff * 1.8)));
    
    setCatcherX(Math.max(5, Math.min(95, pct)));
    prevXRef.current = pct;
  };

  const handleRetry = () => {
    fallingWordsRef.current = [];
    particlesRef.current = [];
    comboFloatsRef.current = [];
    setFallingWords([]);
    setParticles([]);
    setComboFloats([]);

    setPhase(1);
    setWordIndex(0);
    setLives(3);
    setCombo(0);
    setMaxCombo(0);
    setAssembledWords([]);

    wordIndexRef.current = 0;
    livesRef.current = 3;
    comboRef.current = 0;

    setGameState("playing");
    startTimeRef.current = performance.now();
  };

  const progressPct = Math.round((assembledWords.length / TARGET_WORDS.length) * 100);

  // Check if correct word is approaching the catcher to open the envelope
  const correctWord = fallingWords.find((w) => w.isCorrect);
  const isApproaching = correctWord && correctWord.y > 48 && Math.abs(correctWord.x - catcherX) < 18;

  // Render the cursive letter preview bar at the top of the arena
  const renderLetterPreview = () => {
    return (
      <div className="flex flex-wrap justify-center gap-x-2.5 gap-y-1.5 font-serif italic text-base md:text-lg text-zinc-850 py-3.5 px-5 bg-white/45 backdrop-blur-md rounded-2xl border border-pink-100/60 shadow-inner max-w-lg w-full text-center relative z-20">
        {TARGET_WORDS.map((w, idx) => {
          const isCaught = idx < assembledWords.length;
          const isCurrent = idx === assembledWords.length;

          if (isCaught) {
            return (
              <span 
                key={idx} 
                className="text-pink-650 font-bold transition-all duration-300 drop-shadow-[0_2px_4px_rgba(244,63,94,0.12)]"
              >
                {w}
              </span>
            );
          } else if (isCurrent) {
            return (
              <span 
                key={idx} 
                className="text-pink-400 font-semibold border-b-2 border-dashed border-pink-400 px-2 min-w-[28px] inline-block animate-correct-target"
              >
                ?
              </span>
            );
          } else {
            return (
              <span key={idx} className="text-zinc-350 select-none px-0.5">
                {"_".repeat(w.length)}
              </span>
            );
          }
        })}
      </div>
    );
  };

  return (
    <div className={`w-full max-w-2xl bg-white/75 backdrop-blur-xl border border-pink-200 shadow-[0_20px_50px_rgba(244,63,94,0.12)] rounded-[2.5rem] p-5 md:p-8 flex flex-col justify-between transition-all duration-300 relative group overflow-hidden select-none z-10 animate-border-pulse ${shake ? "animate-shake" : ""}`}>
      
      {/* Decorative Hearts in Corners */}
      <Heart className="w-3.5 h-3.5 text-pink-300/40 absolute top-4 left-4" />
      <Heart className="w-3.5 h-3.5 text-pink-300/40 absolute top-4 right-4" />
      <Heart className="w-3.5 h-3.5 text-pink-300/40 absolute bottom-4 left-4" />
      <Heart className="w-3.5 h-3.5 text-pink-300/40 absolute bottom-4 right-4" />

      {/* Screen flash overlays */}
      {flashType === "red" && <div className="absolute inset-0 bg-rose-500/10 pointer-events-none z-50 animate-flash-red rounded-[2.5rem]" />}
      {flashType === "pink" && <div className="absolute inset-0 bg-pink-500/10 pointer-events-none z-50 animate-flash-pink rounded-[2.5rem]" />}

      {/* 1. INTRO SCREEN */}
      {gameState === "intro" && (
        <div className="w-full py-4 flex flex-col items-center justify-center text-center space-y-6 animate-scale-up">
          <div className="relative">
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-pink-400 to-rose-455 opacity-25 blur-lg animate-pulse" />
            <div className="w-20 h-20 rounded-full bg-white border border-pink-100 flex items-center justify-center shadow-md shadow-pink-100 relative">
              <Heart className="w-10 h-10 text-pink-500 fill-pink-500 animate-bounce" style={{ animationDuration: '2.5s' }} />
            </div>
          </div>

          <div className="space-y-2 max-w-sm px-4">
            <h3 className="font-editorial text-2xl md:text-3xl font-bold text-zinc-950 animate-pulse">
              Love Letter Assembly
            </h3>
            <p className="font-editorial-body text-xs md:text-sm text-zinc-650 leading-relaxed">
              Help me piece together my thoughts. Catch the correct words falling from the sky to build our letter, but watch out for distractors!
            </p>
          </div>

          {/* Instruction Box */}
          <div className="bg-pink-50/40 border border-pink-100/60 rounded-2xl p-4 max-w-md w-[92%] text-left space-y-3 font-mono text-[11px] text-zinc-650 shadow-inner">
            <div className="flex items-center gap-2 text-pink-650 font-bold">
              <Info className="w-4 h-4 animate-bounce" />
              <span>HOW TO PLAY:</span>
            </div>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Drag the <strong className="text-zinc-900">Envelope</strong> left and right with your <strong className="text-zinc-900">finger or mouse</strong>.</li>
              <li>Catch the <strong className="text-pink-600 font-bold">pink-bordered words</strong> in sequence to construct the letter.</li>
              <li>Avoid catching <strong className="text-zinc-500">gray distractor words</strong> (wrong catches break hearts!).</li>
              <li>Complete all 3 phases to reveal the final letter seal.</li>
            </ul>
          </div>

          <button
            onClick={() => {
              setGameState("playing");
              startTimeRef.current = performance.now();
              if (!muted) {
                synth.playAccessGrantedChime();
              }
            }}
            className="px-8 py-3.5 bg-pink-500 hover:bg-pink-600 text-white font-mono text-xs uppercase tracking-widest rounded-full shadow-[4px_4px_0px_#e11d48] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[3px_3px_0px_#e11d48] active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 group font-bold cursor-pointer"
          >
            BEGIN ASSEMBLY
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {/* 2. PLAYING SCREEN */}
      {gameState === "playing" && (
        <div className="flex-1 flex flex-col space-y-4 py-2 w-full">
          {/* Header Bar */}
          <div className="flex justify-between items-center border-b border-pink-100 pb-3 relative z-10 w-full px-1">
            {/* Left: Phase Indicators */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] font-bold tracking-wider text-pink-655 uppercase">
                PHASE {phase}/3
              </span>
              <div className="flex gap-1">
                {[1, 2, 3].map((p) => (
                  <div 
                    key={p} 
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      p < phase 
                        ? "bg-pink-500" 
                        : p === phase 
                        ? "bg-pink-400 animate-pulse scale-110 shadow-[0_0_8px_rgba(244,63,94,0.4)]" 
                        : "bg-zinc-200"
                    }`}
                  />
                ))}
              </div>
            </div>
            
            {/* Center: Info Title */}
            <span className="hidden sm:inline font-mono text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              Assemble the Letter
            </span>

            {/* Right: Lives */}
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[9px] font-bold text-zinc-400 mr-0.5 uppercase">LIVES:</span>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((idx) => {
                  const isActive = idx < lives;
                  return (
                    <div key={idx} className="relative w-4 h-4 flex items-center justify-center">
                      <Heart 
                        className={`w-4.5 h-4.5 transition-all duration-300 ${
                          isActive 
                            ? "text-pink-500 fill-pink-500 filter drop-shadow-[0_1px_2px_rgba(244,63,94,0.3)] animate-pulse" 
                            : "text-zinc-200 fill-zinc-150"
                        }`} 
                      />
                      {!isActive && idx === lives && (
                        <Heart className="w-4.5 h-4.5 text-rose-500 fill-rose-455 absolute top-0 left-0 animate-heart-shatter pointer-events-none" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Letter preview */}
          {renderLetterPreview()}

          {/* Game Arena Box */}
          <div 
            ref={arenaRef}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onTouchStart={handleTouchMove}
            className="w-full h-72 border border-pink-100/70 bg-gradient-to-b from-pink-50/20 via-rose-50/10 to-pink-100/10 rounded-2xl relative overflow-hidden cursor-crosshair shadow-inner"
          >
            {/* Grid Background Line */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(244,63,94,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(244,63,94,0.015)_1px,transparent_1px)] bg-[size:16px_16px]" />

            {/* Slow Floating Decorative Background Hearts */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.12]">
              <Heart className="absolute bottom-0 left-[10%] text-pink-400 w-4.5 h-4.5 animate-float-1" style={{ animationDelay: '0s' }} />
              <Heart className="absolute bottom-0 left-[35%] text-pink-400 w-6 h-6 animate-float-2" style={{ animationDelay: '2.5s' }} />
              <Heart className="absolute bottom-0 left-[58%] text-pink-400 w-5 h-5 animate-float-3" style={{ animationDelay: '5s' }} />
              <Heart className="absolute bottom-0 left-[78%] text-pink-400 w-7 h-7 animate-float-4" style={{ animationDelay: '1.2s' }} />
              <Heart className="absolute bottom-0 left-[92%] text-pink-400 w-4 h-4 animate-float-5" style={{ animationDelay: '6s' }} />
            </div>

            {/* Falling words */}
            {fallingWords.map((word) => (
              <div
                key={word.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none transition-all duration-75 animate-word-wobble"
                style={{
                  left: `${word.x}%`,
                  top: `${word.y}%`,
                  animationDelay: `${word.id % 1.5}s`
                }}
              >
                {word.isCorrect ? (
                  <div className="relative group/pill">
                    {/* Glowing outer pulse ring for correct target word */}
                    <div className="absolute -inset-1.5 rounded-full border border-pink-400/40 animate-ping pointer-events-none opacity-40" />
                    <div className="bg-white border-2 border-pink-450 text-pink-655 font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse whitespace-nowrap relative z-10">
                      {word.text}
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-50/90 border border-zinc-300 text-zinc-500 font-medium px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm shadow-sm whitespace-nowrap">
                    {word.text}
                  </div>
                )}
              </div>
            ))}

            {/* Interactive Particle Burst Effects */}
            {particles.map((p) => (
              <div
                key={p.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  opacity: p.life,
                  transform: `translate(-50%, -50%) scale(${p.life * 1.5})`,
                }}
              >
                {p.type === "heart" ? (
                  <Heart className={`w-3.5 h-3.5 fill-current ${p.color}`} />
                ) : p.type === "sparkle" ? (
                  <Sparkles className={`w-3 h-3 fill-current ${p.color}`} />
                ) : (
                  <div className={`w-1.5 h-1.5 rotate-45 bg-zinc-400 rounded-sm ${p.color}`} />
                )}
              </div>
            ))}

            {/* Physics-driven Combo Floats */}
            {comboFloats.map((float) => {
              const opacity = (50 - float.age) / 50;
              return (
                <div
                  key={float.id}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 font-mono text-[10px] md:text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm pointer-events-none z-30 transition-all duration-75 ${
                    float.isError 
                      ? "text-rose-600 bg-rose-50 border border-rose-200" 
                      : "text-pink-655 bg-pink-50 border border-pink-200"
                  }`}
                  style={{
                    left: `${float.x}%`,
                    top: `${float.y}%`,
                    opacity: opacity,
                    transform: `translate(-50%, -50%) scale(${0.8 + (1 - opacity) * 0.4})`
                  }}
                >
                  {float.text}
                </div>
              );
            })}

            {/* Envelope Catcher */}
            <div 
              className="absolute bottom-2.5 -translate-x-1/2 flex flex-col items-center select-none pointer-events-none transition-transform duration-150"
              style={{ 
                left: `${catcherX}%`,
                transform: `translate(-50%, 0) rotate(${tilt}deg)` 
              }}
            >
              {/* Envelope Shape */}
              <div className="relative w-24 md:w-28 h-12 flex flex-col justify-end">
                {/* Open flap */}
                <div className="absolute top-0 left-0 right-0 h-5 overflow-hidden flex justify-center z-0">
                  <div className="w-14 h-14 bg-rose-200 border border-rose-455 rotate-45 transform origin-bottom rounded-tl-lg shadow-sm" style={{ transform: 'rotate(45deg) translateY(6px)' }} />
                </div>
                
                {/* Letter card inside (slides up on correct word approach) */}
                <div className={`absolute left-1/2 -translate-x-1/2 w-[85%] bg-white border border-pink-200 rounded-md shadow-inner flex items-center justify-center font-mono text-[9px] font-bold text-pink-655 transition-all duration-300 z-0 ${
                  isApproaching ? "h-8.5 -top-4 shadow-md" : "h-6 top-1 animate-pulse"
                }`}>
                  <Heart className={`w-3 h-3 fill-pink-500 text-pink-500 mr-1 ${isApproaching ? "animate-ping" : "animate-pulse"}`} />
                  M + Y
                </div>
                
                {/* Envelope body (covers bottom) */}
                <div className="w-full h-8 bg-rose-300 border-2 border-rose-400 rounded-b-xl relative z-10 flex items-center justify-center overflow-hidden shadow-md">
                  <div className="absolute inset-0 bg-gradient-to-tr from-rose-400/10 to-transparent pointer-events-none" />
                  {/* Folds lines */}
                  <div className="absolute bottom-0 left-0 w-1/2 h-full border-t border-r border-rose-400/40 origin-bottom-left skew-y-12" />
                  <div className="absolute bottom-0 right-0 w-1/2 h-full border-t border-l border-rose-400/40 origin-bottom-right -skew-y-12" />
                </div>
              </div>
              
              {/* Catcher alignment pointer */}
              <div className="w-1 h-1.5 bg-rose-400/30 rounded-full" />
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex justify-between items-center w-full px-2">
            <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[10px]">
              STREAK: <span className="font-bold text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded border border-pink-100">×{combo}</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500">
              PROGRESS: <span className="font-bold text-pink-600">{progressPct}%</span>
              <div className="w-20 h-2 bg-pink-50 rounded-full overflow-hidden border border-pink-150 ml-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-pink-400 to-rose-500 transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. PHASE TRANSITION SCREEN */}
      {gameState === "phase-transition" && (
        <div className="w-full py-12 flex flex-col items-center justify-center text-center space-y-6 animate-phase-unlock">
          <div className="relative">
            <div className="absolute -inset-2 rounded-full bg-pink-500 opacity-25 blur-md animate-ping" />
            <div className="w-20 h-20 rounded-full bg-pink-500 border-4 border-white flex items-center justify-center shadow-lg relative">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-editorial text-2xl md:text-3xl font-bold text-zinc-950">
              Phrase Completed!
            </h3>
            <p className="font-mono text-xs text-pink-655 uppercase tracking-widest animate-pulse font-bold">
              Unlocking Phase {phase}...
            </p>
          </div>

          {/* Showing current assembly status */}
          <div className="max-w-md bg-white/60 border border-pink-100 rounded-2xl p-4 font-serif italic text-base text-pink-750 shadow-inner leading-relaxed">
            "{assembledWords.join(" ")}"
          </div>
        </div>
      )}

      {/* 4. GAME OVER SCREEN */}
      {gameState === "game-over" && (
        <div className="w-full py-8 flex flex-col items-center justify-center text-center space-y-6 animate-scale-up">
          <div className="w-20 h-20 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center shadow-inner">
            <AlertCircle className="w-10 h-10 text-zinc-400" />
          </div>

          <div className="space-y-2 max-w-sm px-4">
            <h3 className="font-editorial text-2xl md:text-3xl font-bold text-zinc-950 animate-shake">
              Heartbreak! 💔
            </h3>
            <p className="font-editorial-body text-xs md:text-sm text-zinc-650 leading-relaxed">
              No worries! Sometimes our feelings get tangled. Let's try assembling the letter again.
            </p>
          </div>

          {/* Stats recap */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 max-w-xs w-[85%] font-mono text-[11px] text-zinc-500 flex justify-around shadow-sm">
            <div>
              <div>COMPLETED</div>
              <div className="text-zinc-850 font-bold text-sm mt-0.5">{progressPct}%</div>
            </div>
            <div className="border-l border-zinc-200 h-8" />
            <div>
              <div>PEAK STREAK</div>
              <div className="text-zinc-850 font-bold text-sm mt-0.5">×{maxCombo}</div>
            </div>
          </div>

          <button
            onClick={handleRetry}
            className="px-8 py-3.5 bg-zinc-850 hover:bg-zinc-900 text-white font-mono text-xs uppercase tracking-widest rounded-full shadow-[4px_4px_0px_#27272a] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[3px_3px_0px_#27272a] active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 group font-bold cursor-pointer"
          >
            RETRY ASSEMBLY
            <RotateCcw className="w-4 h-4 group-hover:rotate-45 transition-transform" />
          </button>
        </div>
      )}

      {/* 5. VICTORY SCREEN */}
      {gameState === "victory" && (
        <div className="w-full py-4 flex flex-col items-center justify-center text-center space-y-6 animate-scale-up">
          <div className="relative">
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-pink-400 to-rose-455 opacity-35 blur-xl animate-pulse" />
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 border-4 border-white flex items-center justify-center shadow-xl relative animate-bounce" style={{ animationDuration: '3.5s' }}>
              <Trophy className="w-9 h-9 text-white" />
            </div>
          </div>

          <div className="space-y-2 max-w-md px-4">
            <h3 className="font-editorial text-2.5xl md:text-3.5xl font-bold text-zinc-950">
              Letter Assembled! 💌
            </h3>
            <p className="font-editorial-body text-xs md:text-sm text-zinc-650">
              You've pieced together my thoughts perfectly. Here is the letter you built:
            </p>
          </div>

          {/* Full letter scroll card */}
          <div className="max-w-md w-[92%] bg-gradient-to-b from-rose-50/40 to-pink-50/20 border-2 border-pink-200 rounded-[2rem] p-6 shadow-inner relative overflow-hidden group">
            {/* Decorative brackets */}
            <div className="absolute top-3 left-3 text-pink-300/40 select-none">┌</div>
            <div className="absolute top-3 right-3 text-pink-300/40 select-none">┐</div>
            <div className="absolute bottom-3 left-3 text-pink-300/40 select-none">└</div>
            <div className="absolute bottom-3 right-3 text-pink-300/40 select-none">┘</div>

            {/* Beautiful handwriting styling - hoverable interactive letter words */}
            <p className="font-serif italic text-base md:text-lg text-pink-750 leading-loose py-2 select-text tracking-wide drop-shadow-[0_1px_2px_rgba(244,63,94,0.08)] flex flex-wrap justify-center gap-x-1.5">
              {"You are my entire universe and forever will be.".split(" ").map((word, i) => (
                <span 
                  key={i} 
                  className="hover:scale-110 hover:text-rose-600 hover:drop-shadow-[0_4px_10px_rgba(244,63,94,0.4)] transition-all duration-200 cursor-default"
                >
                  {word}
                </span>
              ))}
            </p>
          </div>

          {/* Final Stats Table */}
          <div className="bg-white/60 border border-pink-100 rounded-2xl p-4 max-w-sm w-[92%] font-mono text-[9px] md:text-[10px] text-zinc-550 grid grid-cols-3 divide-x divide-pink-100/60 shadow-sm">
            <div className="px-1">
              <div>TIME TAKEN</div>
              <div className="text-zinc-850 font-bold text-xs mt-1">{elapsedTime}s</div>
            </div>
            <div className="px-1">
              <div>PEAK STREAK</div>
              <div className="text-zinc-850 font-bold text-xs mt-1">{maxCombo > 0 ? `×${maxCombo}` : "None"}</div>
            </div>
            <div className="px-1">
              <div>HEARTS KEPT</div>
              <div className="text-pink-650 font-bold text-xs mt-1.5 flex justify-center gap-0.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart 
                    key={i} 
                    className={`w-3.5 h-3.5 ${
                      i < lives ? "fill-pink-500 text-pink-500" : "text-zinc-200 fill-zinc-100"
                    }`} 
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={onComplete}
            className="px-8 py-3.5 bg-pink-500 hover:bg-pink-600 text-white font-mono text-xs uppercase tracking-widest rounded-full shadow-[4px_4px_0px_#e11d48] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[3px_3px_0px_#e11d48] active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 group font-bold cursor-pointer"
          >
            PROCEED TO FOREVER
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {/* Embedded CSS Keyframes */}
      <style>{`
        @keyframes borderPulse {
          0% { border-color: rgba(244, 63, 94, 0.5); box-shadow: 0 10px 40px rgba(244, 63, 94, 0.08); }
          50% { border-color: rgba(236, 72, 153, 0.7); box-shadow: 0 10px 40px rgba(236, 72, 153, 0.18); }
          100% { border-color: rgba(244, 63, 94, 0.5); box-shadow: 0 10px 40px rgba(244, 63, 94, 0.08); }
        }

        .animate-border-pulse {
          animation: borderPulse 3s infinite ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          10%, 30%, 50%, 70%, 90% { transform: translate(-3.5px, 1.5px); }
          20%, 40%, 60%, 80% { transform: translate(3.5px, -1.5px); }
        }

        .animate-shake {
          animation: shake 0.35s ease-in-out;
        }

        @keyframes flashRed {
          0% { opacity: 0.55; }
          100% { opacity: 0; }
        }

        .animate-flash-red {
          animation: flashRed 0.35s ease-out forwards;
        }

        @keyframes flashPink {
          0% { opacity: 0.38; }
          100% { opacity: 0; }
        }

        .animate-flash-pink {
          animation: flashPink 0.3s ease-out forwards;
        }

        @keyframes heartShatter {
          0% { transform: scale(1) rotate(0deg); opacity: 1; }
          30% { transform: scale(1.4) rotate(-15deg); opacity: 0.85; filter: hue-rotate(90deg); }
          100% { transform: scale(0) rotate(90deg) translateY(45px); opacity: 0; filter: blur(1.2px); }
        }

        .animate-heart-shatter {
          animation: heartShatter 0.65s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes wordWobble {
          0%, 100% { transform: translate(-50%, -50%) rotate(-4deg); }
          50% { transform: translate(-50%, -50%) rotate(4deg); }
        }

        .animate-word-wobble {
          animation: wordWobble 2.5s infinite ease-in-out;
        }

        @keyframes floatUp {
          0% { transform: translateY(110%) scale(0.6) rotate(0deg); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { transform: translateY(-10%) scale(1.2) rotate(360deg); opacity: 0; }
        }

        .animate-float-1 { animation: floatUp 8s infinite linear; }
        .animate-float-2 { animation: floatUp 12s infinite linear; }
        .animate-float-3 { animation: floatUp 10s infinite linear; }
        .animate-float-4 { animation: floatUp 14s infinite linear; }
        .animate-float-5 { animation: floatUp 9s infinite linear; }

        @keyframes phaseUnlock {
          0% { transform: scale(0.65); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }

        .animate-phase-unlock {
          animation: phaseUnlock 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes scaleUp {
          0% { transform: scale(0.92); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .animate-scale-up {
          animation: scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes targetPulse {
          0%, 100% { border-color: rgb(244, 63, 94); box-shadow: 0 0 4px rgba(244, 63, 94, 0.2); }
          50% { border-color: rgb(236, 72, 153); box-shadow: 0 0 12px rgba(236, 72, 153, 0.6); }
        }
        .animate-correct-target {
          animation: targetPulse 1.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
