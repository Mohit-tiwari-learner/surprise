"use client";

import React, { useState, useEffect, useRef } from "react";
import { Heart, Sparkles, ChevronRight, Volume2 } from "lucide-react";
import { synth } from "./AudioSynth";

interface FallingItem {
  id: number;
  x: number; // Percentage 5 - 95
  y: number; // Percentage 0 - 100
  speed: number;
  type: "heart" | "sparkle";
  word: string;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
}

interface LoveCatchGameProps {
  onComplete: () => void;
  muted: boolean;
}

export default function LoveCatchGame({ onComplete, muted }: LoveCatchGameProps) {
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [catcherX, setCatcherX] = useState(50); // Catcher X position percentage (5 to 95)
  const [items, setItems] = useState<FallingItem[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [isVictory, setIsVictory] = useState(false);

  const arenaRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const lastSpawnRef = useRef<number>(0);

  const romanticWords = [
    "Smile 😊", "Laughter 😂", "Cuddles 🫂", "Trust 🤝", "Warmth ☀️", 
    "Holding Hands 🤝", "Late Nights 🌙", "Our Future 💍", "Forever ❤️", 
    "Kindness 🌸", "Shared Dreams ✨", "My Chaos 🌪️", "Complete 🧩"
  ];

  // Spawn a new item
  const spawnItem = () => {
    const isHeart = Math.random() > 0.35;
    const newItem: FallingItem = {
      id: Math.random() + Date.now(),
      x: 10 + Math.random() * 80, // Keep away from extreme edges
      y: 0,
      speed: 1.2 + Math.random() * 1.5,
      type: isHeart ? "heart" : "sparkle",
      word: romanticWords[Math.floor(Math.random() * romanticWords.length)]
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Move catcher based on mouse movement
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!arenaRef.current || isVictory) return;
    const rect = arenaRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const pct = (relativeX / rect.width) * 100;
    setCatcherX(Math.max(5, Math.min(95, pct)));
  };

  // Move catcher based on touch movement (for mobile compatibility)
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!arenaRef.current || isVictory || e.touches.length === 0) return;
    const rect = arenaRef.current.getBoundingClientRect();
    const relativeX = e.touches[0].clientX - rect.left;
    const pct = (relativeX / rect.width) * 100;
    setCatcherX(Math.max(5, Math.min(95, pct)));
  };

  // Main game loop update
  useEffect(() => {
    if (!isPlaying || isVictory) {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      return;
    }

    const update = (time: number) => {
      // Spawn items every 1.2 seconds
      if (time - lastSpawnRef.current > 1200) {
        spawnItem();
        lastSpawnRef.current = time;
      }

      setItems((prevItems) => {
        const updated: FallingItem[] = [];

        prevItems.forEach((item) => {
          const nextY = item.y + item.speed;

          // Check for collision when item reaches the bottom (y between 85% and 93%)
          if (nextY >= 85 && nextY <= 92) {
            const distance = Math.abs(item.x - catcherX);
            
            // Catcher width is roughly 18% of the container width
            if (distance < 10) {
              // Item caught!
              setScore((prevScore) => {
                const nextScore = prevScore + 1;
                if (!muted) {
                  synth.playCatchChime(prevScore);
                }
                if (nextScore >= 10) {
                  setIsVictory(true);
                  if (!muted) {
                    synth.playProposalSuccessMagic();
                  }
                }
                return nextScore;
              });

              // Add a floating text
              setFloatingTexts((prev) => [
                ...prev,
                {
                  id: Math.random() + Date.now(),
                  x: item.x,
                  y: 75,
                  text: item.word
                }
              ]);
              return; // Remove item from items array
            }
          }

          // Keep item if it hasn't fallen past the bottom of the arena (100%)
          if (nextY < 100) {
            updated.push({ ...item, y: nextY });
          }
        });

        return updated;
      });

      gameLoopRef.current = requestAnimationFrame(update);
    };

    gameLoopRef.current = requestAnimationFrame(update);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [isPlaying, isVictory, catcherX, muted]);

  // Clean up floating texts over time
  useEffect(() => {
    if (floatingTexts.length === 0) return;
    const timer = setTimeout(() => {
      setFloatingTexts((prev) => prev.slice(1));
    }, 1500);
    return () => clearTimeout(timer);
  }, [floatingTexts]);

  return (
    <div className="w-full max-w-2xl bg-white border-2 border-pink-400 shadow-[8px_8px_0px_#f43f5e] rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between transition-all duration-300 relative group overflow-hidden select-none z-10">
      
      {/* Top Header */}
      <div className="flex justify-between items-center border-b border-pink-100 pb-3 relative z-10">
        <span className="font-mono text-[9px] font-bold tracking-widest uppercase text-pink-650">
          03.5.exe // HEARTBEAT_SYNC
        </span>
        <div className="flex items-center gap-1.5 font-bold text-pink-600 font-mono text-[10px]">
          SYNC RATE: {score * 10}%
          <div className="w-16 h-2 bg-pink-100 rounded-full overflow-hidden ml-1">
            <div 
              className="h-full bg-pink-500 transition-all duration-300"
              style={{ width: `${score * 10}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Container Body */}
      <div className="flex-1 py-4 flex flex-col items-center justify-center space-y-4">
        {!isVictory ? (
          <>
            <div className="text-center space-y-1">
              <h3 className="font-editorial text-xl md:text-2xl font-bold text-zinc-950">
                Catch My Feelings
              </h3>
              <p className="font-editorial-body text-xs text-zinc-600">
                Move the catcher at the bottom to catch 10 floating hearts & sparkles.
              </p>
            </div>

            {/* Game Arena Box */}
            <div 
              ref={arenaRef}
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
              onTouchStart={handleTouchMove}
              className="w-full h-64 border-2 border-dashed border-pink-200 bg-pink-50/15 rounded-2xl relative overflow-hidden cursor-crosshair shadow-inner"
            >
              {/* Grid Background Line */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(244,63,94,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(244,63,94,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />

              {/* Falling items */}
              {items.map((item) => (
                <div
                  key={item.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none transition-all duration-75"
                  style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                  }}
                >
                  {item.type === "heart" ? (
                    <Heart className="w-6 h-6 text-pink-500 fill-pink-500 filter drop-shadow-[0_2px_4px_rgba(244,63,94,0.3)] animate-pulse" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-amber-400 fill-amber-300 filter drop-shadow-[0_2px_4px_rgba(245,158,11,0.3)] animate-spin" style={{ animationDuration: "3s" }} />
                  )}
                </div>
              ))}

              {/* Floating Caught Texts */}
              {floatingTexts.map((txt) => (
                <div
                  key={txt.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 font-mono text-[9px] font-bold text-pink-700 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-full shadow-sm animate-[float_1.5s_ease-out_forwards] pointer-events-none"
                  style={{
                    left: `${txt.x}%`,
                    top: `${txt.y}%`,
                  }}
                >
                  {txt.text}
                </div>
              ))}

              {/* Catcher Container */}
              <div 
                className="absolute bottom-2 -translate-x-1/2 flex flex-col items-center select-none pointer-events-none"
                style={{ left: `${catcherX}%` }}
              >
                {/* Visual Glow */}
                <div className="w-16 h-8 bg-pink-500 border-2 border-pink-600 rounded-xl shadow-[0_0_15px_rgba(244,63,94,0.6)] flex items-center justify-center text-white font-mono text-[9px] font-bold">
                  <Heart className="w-3.5 h-3.5 fill-white text-white mr-1 animate-pulse" />
                  M + Y
                </div>
                <div className="w-1 h-2 bg-pink-600/40 rounded-full" />
              </div>
            </div>
          </>
        ) : (
          /* Victory screen overlay */
          <div className="w-full py-8 flex flex-col items-center justify-center space-y-6 animate-[scaleUp_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)]">
            
            {/* Glowing seal icon */}
            <div className="w-20 h-20 rounded-full bg-pink-500 border-4 border-white flex items-center justify-center shadow-lg shadow-pink-200 animate-bounce">
              <Sparkles className="w-10 h-10 text-white fill-white" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-editorial text-3xl font-bold text-zinc-950">
                100% Synced! 💖
              </h3>
              <p className="font-editorial-body text-base text-zinc-700 leading-normal max-w-sm">
                Our heart rates are perfectly synchronized, and our connection is fully established. 
              </p>
            </div>

            <button
              onClick={onComplete}
              className="px-8 py-3.5 bg-pink-500 hover:bg-pink-600 text-white font-mono text-xs uppercase tracking-widest rounded-full shadow-[4px_4px_0px_#e11d48] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#e11d48] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 group font-bold cursor-pointer relative overflow-hidden"
            >
              PROCEED TO FOREVER
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>

      {/* Styles for floating animations */}
      <style>{`
        @keyframes float {
          0% {
            transform: translate(-50%, -50%) translateY(0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translateY(-60px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
