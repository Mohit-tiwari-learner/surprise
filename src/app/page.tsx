"use client";

import React, { useState, useEffect, useRef } from "react";
import { synth } from "@/components/AudioSynth";
import HolographicHeart from "@/components/HolographicHeart";
import FireworkCelebration from "@/components/FireworkCelebration";
import LoveCatchGame from "@/components/LoveCatchGame";
import { AlertTriangle, ChevronDown, Volume2, VolumeX, Terminal as TermIcon, Heart, CheckCircle2, Image as ImageIcon, ArrowRight, Sparkles, ArrowDown, Plus, ChevronLeft, ChevronRight, Smile, Mail, Check, Copy, FileText, Link2 } from "lucide-react";
import confetti from "canvas-confetti";
import gsap from "gsap";

const AsciiHeart = () => (
  <pre className="text-cyber-red text-[8px] md:text-[10px] leading-[8px] md:leading-[10px] select-none mr-4 font-mono font-bold glow-red">
{`   ::   ::   
 ::::: ::::: 
:::::::::::::
:::::::::::::
  :::::::::  
    :::::    
      :      `}
  </pre>
);

const successPetals = Array.from({ length: 35 }).map((_, i) => {
  const left = Math.random() * 100;
  const delay = Math.random() * 8;
  const duration = 5 + Math.random() * 6;
  const size = 12 + Math.random() * 16;
  const sway = 20 + Math.random() * 30;
  const rotate = Math.random() * 360;
  const scale = 0.5 + Math.random() * 0.9;
  const blur = Math.max(0, (1.2 - scale) * 3);
  return { id: i, left, delay, duration, size, sway, rotate, scale, blur };
});

const successSparkles = Array.from({ length: 25 }).map((_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  delay: `${Math.random() * 5}s`,
  size: `${2 + Math.random() * 3}px`
}));

export default function ProposalPage() {
  const [act, setAct] = useState<1 | 2 | 3>(1); // 1 = Terminal, 2 = Transitioning, 3 = Dream World
  const [terminalPage, setTerminalPage] = useState<1 | 2 | 3>(1); // Act 1 subpages
  
  // Audio state
  const [muted, setMuted] = useState(false);
  
  // Act 1 Page 2: Heart Locator typing logs
  const [logs, setLogs] = useState<{ text: string; status?: string }[]>([]);
  const [logIndex, setLogIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchingDots, setSearchingDots] = useState("");
  const [scanResultRevealed, setScanResultRevealed] = useState(false);

  // Act 1 Page 3: Access Granted commands
  const [cmdIndex, setCmdIndex] = useState(0);
  const [cmdLogs, setCmdLogs] = useState<{ cmd: string; res: string; typed: string; done: boolean; isPink?: boolean }[]>([
    { cmd: "> whoami", res: "Mohit", typed: "", done: false },
    { cmd: "> current_mission", res: "Make Yasha Smile", typed: "", done: false },
    { cmd: "> relationship_status", res: "Madly In Love", typed: "", done: false, isPink: true },
    { cmd: "> life_goal", res: "Spend Forever With Yasha", typed: "", done: false },
  ]);
  const [showAccessButton, setShowAccessButton] = useState(false);

  // Act 3: Scrolling effects
  const [bloomActive, setBloomActive] = useState(false);
  const [yesClicked, setYesClicked] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const handleCopyProjectName = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText("yasha_proposal.exe");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [isYashaHovered, setIsYashaHovered] = useState(false);
  const [activeReasonIndex, setActiveReasonIndex] = useState(2);
  const [isLetterOpen, setIsLetterOpen] = useState(false);
  
  // Runaway NO button position
  const [noBtnPos, setNoBtnPos] = useState({ x: 0, y: 0 });
  const [noHoverCount, setNoHoverCount] = useState(0);

  // Refs for GSAP
  const transitionScreenRef = useRef<HTMLDivElement>(null);
  const shootingStarRef = useRef<HTMLDivElement>(null);
  const textFragRef = useRef<HTMLDivElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  
  const bloomSectionRef = useRef<HTMLDivElement>(null);
  const gameSectionRef = useRef<HTMLDivElement>(null);
  const proposalSectionRef = useRef<HTMLDivElement>(null);
  const [gameActive, setGameActive] = useState(false);

  // Hydration safety for random particles/stars
  interface ParticleData {
    top: string;
    left: string;
    delay: string;
    duration: string;
    size?: string;
  }
  const [pinkParticles, setPinkParticles] = useState<ParticleData[]>([]);
  const [microStars, setMicroStars] = useState<ParticleData[]>([]);

  // Interactive Cursor & Parallax trail data
  interface TrailHeart {
    id: number;
    x: number;
    y: number;
    size: number;
    rotation: number;
    tx?: string;
    ty?: string;
    isBurst?: boolean;
  }
  const [trailHearts, setTrailHearts] = useState<TrailHeart[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Generate pink particles
    const pink = Array.from({ length: 20 }).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      duration: `${2 + Math.random() * 3}s`,
    }));
    setPinkParticles(pink);

    // Generate micro stars
    const stars = Array.from({ length: 45 }).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${2 + Math.random() * 4}s`,
      size: `${1 + Math.random() * 3}px`,
    }));
    setMicroStars(stars);
  }, []);

  // Monitor mousemove for custom cursor trails & cloud parallax (Dream world only)
  useEffect(() => {
    if (act !== 3) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Offset values for parallax
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 35,
        y: (e.clientY / window.innerHeight - 0.5) * 35,
      });

      // Throttle trail spawn rate
      if (Math.random() > 0.22) return;

      const newHeart: TrailHeart = {
        id: Math.random() + Date.now(),
        x: e.pageX,
        y: e.pageY,
        size: 8 + Math.random() * 14,
        rotation: (Math.random() - 0.5) * 45,
        isBurst: false
      };

      setTrailHearts((prev) => [...prev.slice(-40), newHeart]);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [act]);

  // Controls soft ambient background lo-fi music in Act 3
  useEffect(() => {
    if (act === 3 && !muted) {
      synth.startBackgroundMusic();
    } else {
      synth.stopBackgroundMusic();
    }
    return () => {
      synth.stopBackgroundMusic();
    };
  }, [act, muted]);

  // Burst hearts when hovering Yasha's name
  const handleYashaHover = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2 + window.scrollX;
    const centerY = rect.top + rect.height / 2 + window.scrollY;

    const burstCount = 8;
    const burstHearts: TrailHeart[] = Array.from({ length: burstCount }).map((_, i) => {
      const angle = (i / burstCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const distance = 45 + Math.random() * 55;
      return {
        id: Math.random() + Date.now() + i,
        x: centerX,
        y: centerY,
        size: 10 + Math.random() * 12,
        rotation: (Math.random() - 0.5) * 60,
        tx: `${Math.cos(angle) * distance}px`,
        ty: `${Math.sin(angle) * distance}px`,
        isBurst: true
      };
    });

    setTrailHearts((prev) => [...prev, ...burstHearts]);
  };

  const handleYashaMouseEnter = (e: React.MouseEvent) => {
    setIsYashaHovered(true);
    handleYashaHover(e);
  };

  const handleYashaMouseLeave = () => {
    setIsYashaHovered(false);
  };

  // Skip animations for Page 2
  const skipScanAnimation = () => {
    setLogs([
      { text: "Initializing Heart Locator...", status: "[ OK ]" },
      { text: "Accessing system files...", status: "[ OK ]" },
      { text: "Scanning through memories...", status: "[ OK ]" },
      { text: "Analyzing connections...", status: "[ OK ]" },
      { text: "Detecting owner...", status: "[ OK ]" },
      { text: "Searching..." },
      { text: "Searching..." },
      { text: "Searching..." },
    ]);
    setLogIndex(10);
    setIsSearching(false);
    setScanResultRevealed(true);
    if (!muted) synth.playAccessGrantedChime();
  };

  // Skip animations for Page 3
  const skipAccessAnimation = () => {
    setCmdLogs([
      { cmd: "> whoami", res: "Mohit", typed: "> whoami", done: true },
      { cmd: "> current_mission", res: "Make Yasha Smile", typed: "> current_mission", done: true },
      { cmd: "> relationship_status", res: "Madly In Love", typed: "> relationship_status", done: true, isPink: true },
      { cmd: "> life_goal", res: "Spend Forever With Yasha", typed: "> life_goal", done: true },
    ]);
    setCmdIndex(4);
    setShowAccessButton(true);
    if (!muted) synth.playAccessGrantedChime();
  };

  // Page click handler for skips and speed
  const handlePageClick = () => {
    if (act === 1) {
      if (terminalPage === 1) {
        triggerPage2();
      } else if (terminalPage === 2) {
        if (!scanResultRevealed) {
          skipScanAnimation();
        } else {
          setTerminalPage(3);
        }
      } else if (terminalPage === 3) {
        if (!showAccessButton) {
          skipAccessAnimation();
        }
      }
    }
  };

  // Keypress listener for Act 1
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (act === 1) {
          if (terminalPage === 1) {
            triggerPage2();
          } else if (terminalPage === 2) {
            if (!scanResultRevealed) {
              skipScanAnimation();
            } else {
              setTerminalPage(3);
            }
          } else if (terminalPage === 3) {
            if (!showAccessButton) {
              skipAccessAnimation();
            } else {
              triggerDreamTransition();
            }
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [act, terminalPage, scanResultRevealed, showAccessButton, muted]);

  // Document-wide first interaction audio warning beep
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!muted) {
        synth.playWarningAlert();
      }
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
    };
    document.addEventListener("click", handleFirstInteraction);
    document.addEventListener("keydown", handleFirstInteraction);
    return () => {
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
    };
  }, [muted]);

  // Page 2: Logger animation
  useEffect(() => {
    if (act !== 1 || terminalPage !== 2) return;

    const logLines = [
      { text: "Initializing Heart Locator..." },
      { text: "Initializing Heart Locator...", status: "[ OK ]" },
      { text: "Accessing system files..." },
      { text: "Accessing system files...", status: "[ OK ]" },
      { text: "Scanning through memories..." },
      { text: "Scanning through memories...", status: "[ OK ]" },
      { text: "Analyzing connections..." },
      { text: "Analyzing connections...", status: "[ OK ]" },
      { text: "Detecting owner..." },
      { text: "Detecting owner...", status: "[ OK ]" },
    ];

    if (logIndex < logLines.length) {
      const timer = setTimeout(() => {
        const line = logLines[logIndex];
        setLogs((prev) => {
          if (line.status) {
            const updated = [...prev];
            updated[updated.length - 1] = line;
            return updated;
          } else {
            return [...prev, line];
          }
        });
        setLogIndex((prev) => prev + 1);
        if (!muted) synth.playTypewriterClick();
      }, 120); // Snappy default typing duration!
      return () => clearTimeout(timer);
    } else if (!isSearching && !scanResultRevealed) {
      setIsSearching(true);
      
      let count = 0;
      const interval = setInterval(() => {
        count++;
        if (count <= 3) {
          setLogs((prev) => [...prev, { text: "Searching..." }]);
          if (!muted) synth.playTypewriterClick();
        } else {
          clearInterval(interval);
          setIsSearching(false);
          setScanResultRevealed(true);
          if (!muted) synth.playAccessGrantedChime();
        }
      }, 200); // Faster search interval (200ms)
      return () => clearInterval(interval);
    }
  }, [act, terminalPage, logIndex, isSearching, scanResultRevealed, muted]);

  // Page 3: Command typewriter animation
  useEffect(() => {
    if (act !== 1 || terminalPage !== 3) return;
    if (cmdIndex >= cmdLogs.length) {
      setShowAccessButton(true);
      return;
    }

    const currentItem = cmdLogs[cmdIndex];
    if (currentItem.typed.length < currentItem.cmd.length) {
      const timer = setTimeout(() => {
        setCmdLogs((prev) => {
          const updated = [...prev];
          updated[cmdIndex].typed = currentItem.cmd.slice(0, currentItem.typed.length + 1);
          return updated;
        });
        if (!muted) synth.playTypewriterClick();
      }, 40); // 40ms typing blips
      return () => clearTimeout(timer);
    } else if (!currentItem.done) {
      const timer = setTimeout(() => {
        setCmdLogs((prev) => {
          const updated = [...prev];
          updated[cmdIndex].done = true;
          return updated;
        });
        if (!muted) synth.playTypewriterClick();
        setCmdIndex((prev) => prev + 1);
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [act, terminalPage, cmdIndex, cmdLogs, muted]);

  // Act 3: Intersection Observer for Color Bloom (Page 6)
  useEffect(() => {
    if (act !== 3) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setBloomActive(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );

    if (bloomSectionRef.current) {
      observer.observe(bloomSectionRef.current);
    }

    return () => observer.disconnect();
  }, [act]);

  // Act 3: Intersection Observer for Game Section (Page 7.5)
  useEffect(() => {
    if (act !== 3) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setGameActive(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );

    if (gameSectionRef.current) {
      observer.observe(gameSectionRef.current);
    }

    return () => observer.disconnect();
  }, [act]);

  const triggerPage2 = () => {
    setTerminalPage(2);
    if (!muted) synth.playWarningAlert();
  };

  // Act 2: Cinematic GSAP Dream Transition
  useEffect(() => {
    if (act !== 2) return;

    // GSAP Transition timelines
    const tl = gsap.timeline({
      onComplete: () => {
        setAct(3);
      },
    });

    // Fade out text fragments
    tl.to(textFragRef.current, {
      opacity: 0,
      scale: 0.9,
      filter: "blur(10px)",
      duration: 1.0,
      ease: "power2.inOut",
    });

    // Pulse and dissolve transition screen background
    tl.fromTo(
      transitionScreenRef.current,
      {
        backgroundColor: "#050505",
      },
      {
        backgroundColor: "#ffffff",
        duration: 2.2,
        ease: "power1.inOut",
      },
      "-=0.6"
    );

    // Shooting star sweep across the screen
    tl.fromTo(
      shootingStarRef.current,
      {
        x: "-100%",
        y: "80%",
        scale: 0.5,
        opacity: 0,
      },
      {
        x: "150%",
        y: "-50%",
        scale: 1.5,
        opacity: 1,
        duration: 1.8,
        ease: "power2.out",
      },
      "-=1.8"
    );
  }, [act]);

  const triggerDreamTransition = () => {
    setAct(2);
    if (!muted) synth.playDreamTransitionSwoop();
  };

  // Runaway button handler
  const handleNoHover = () => {
    setNoHoverCount((c) => c + 1);
    
    // Pick a random location within limits
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const maxDist = isMobile ? 80 : 180;
    const randomAngle = Math.random() * Math.PI * 2;
    const distance = (isMobile ? 40 : 80) + Math.random() * maxDist;
    const x = Math.cos(randomAngle) * distance;
    const y = Math.sin(randomAngle) * distance;

    setNoBtnPos({ x, y });
  };

  const handleYes = () => {
    setYesClicked(true);
    if (!muted) synth.playProposalSuccessMagic();

    // Trigger explosive canvas-confetti
    const duration = 5 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#ff69b4", "#ffb6c1", "#ffd700"],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#ff69b4", "#ffb6c1", "#ffd700"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  const toggleSound = () => {
    setMuted(!muted);
  };

  return (
    <div ref={pageContainerRef} className="min-h-screen relative font-sans select-none overflow-x-hidden">
      
      {/* Sound Toggle (Top-right persistent button) */}
      <button
        onClick={toggleSound}
        className={`fixed top-4 right-4 z-[10000] p-2.5 rounded-full transition-all cursor-pointer flex items-center justify-center ${
          yesClicked
            ? "bg-white border-2 border-pink-100 text-pink-500 shadow-md shadow-pink-100/50 hover:bg-pink-50"
            : "border bg-black/40 border-white/10 backdrop-blur-md hover:bg-white/10 text-white"
        }`}
        aria-label="Toggle audio"
      >
        {muted ? (
          <VolumeX className="w-5 h-5 text-gray-400" />
        ) : (
          <Volume2 className={`w-5 h-5 animate-pulse ${yesClicked ? "text-pink-500" : "text-cyber-red"}`} />
        )}
      </button>

      {/* ======================================================== */}
      {/* ACT 1: HACKER TERMINAL OPERATING SYSTEM                 */}
      {/* ======================================================== */}
      {act === 1 && (
        <div 
          onClick={handlePageClick}
          className="min-h-screen bg-[#050505] text-[#ff1212] crt-flicker relative flex flex-col items-center justify-between p-6 md:p-12 overflow-hidden terminal-grid cursor-pointer"
        >
          {/* CRT Screen Overlays */}
          <div className="crt-overlay" />
          <div className="crt-scanline" />

          {/* Top Info Bar */}
          <div className="w-full flex items-center justify-between font-mono text-xs border-b border-cyber-red/20 pb-2.5">
            <span className="flex items-center gap-2">
              <TermIcon className="w-4 h-4 animate-pulse" />
              project_yasha.exe
            </span>
            <span className="flex items-center gap-1.5 glow-red">
              SYSTEM MONITOR
              <span className="w-2.5 h-2.5 rounded-full bg-cyber-red animate-ping inline-block" />
            </span>
          </div>

          {/* Subpages of Terminal Act */}
          
          {/* PAGE 1: SYSTEM ALERT */}
          {terminalPage === 1 && (
            <div className="flex-1 flex flex-col items-center justify-center max-w-lg w-full text-center gap-8 animate-[fadeIn_0.5s_ease-out]">
              <div className="space-y-2 select-none">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-wider uppercase font-space glow-red glitch-text" data-text="SYSTEM ALERT">
                  SYSTEM ALERT
                </h1>
                <p className="font-mono text-sm uppercase tracking-widest text-white/70">
                  Critical Issue Detected
                </p>
              </div>

              {/* Warning Card */}
              <div className="w-full border-2 border-cyber-red bg-cyber-red/5 glow-red-border p-4 md:p-6 rounded-md space-y-4 animate-[pulse_2s_infinite]">
                <div className="flex justify-center text-cyber-red mb-2">
                  <AlertTriangle className="w-12 h-12" />
                </div>
                <div className="font-mono text-left space-y-2 text-sm md:text-base md:px-4">
                  <div className="flex justify-between border-b border-cyber-red/10 pb-1.5">
                    <span className="text-white/40">Error:</span>
                    <span className="font-bold text-white uppercase">Heart Not Found</span>
                  </div>
                  <div className="flex justify-between border-b border-cyber-red/10 pb-1.5">
                    <span className="text-white/40">Reason:</span>
                    <span className="text-cyber-red font-semibold">Transferred To Yasha</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-white/40">Status:</span>
                    <span className="text-cyber-red font-bold uppercase tracking-widest">Permanent</span>
                  </div>
                </div>
              </div>

              <div className="font-mono text-xs text-white/50 animate-pulse flex items-center gap-1.5">
                Attempting to locate heart.exe
                <span className="inline-flex gap-0.5">
                  <span className="animate-[ping_1s_infinite_100ms]">.</span>
                  <span className="animate-[ping_1s_infinite_300ms]">.</span>
                  <span className="animate-[ping_1s_infinite_500ms]">.</span>
                </span>
              </div>
            </div>
          )}

          {/* PAGE 2: HEART LOCATOR */}
          {terminalPage === 2 && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                handlePageClick();
              }}
              className="flex-1 w-full max-w-4xl border border-cyber-red/35 bg-black/90 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col glow-red-border mt-4 cursor-pointer select-none"
            >
              {/* Window Top Bar */}
              <div className="flex items-center justify-between px-4 py-3 bg-zinc-950/90 border-b border-cyber-red/25 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                  </div>
                  <span className="text-white/60 ml-2 font-mono">project_yasha.exe</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-cyber-red glow-red">
                  SYSTEM MONITOR
                  <span className="w-2 h-2 rounded-full bg-cyber-red animate-ping inline-block" />
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-6 md:p-8 font-mono text-xs md:text-sm">
                
                {/* Left Side: Logs (Col 8) */}
                <div className="md:col-span-8 flex flex-col justify-between h-[280px] md:h-[400px]">
                  <div className="space-y-4">
                    <p className="text-white/40">{`> scan_heart.exe`}</p>

                    <div className="space-y-2">
                      {logs.map((log, i) => (
                        <div key={i} className="flex justify-between items-center text-white/95">
                          <span>{log.text}</span>
                          {log.status && (
                            <span className="text-cyber-green font-bold glow-green">{log.status}</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {isSearching && (
                      <div className="border-t border-dashed border-cyber-red/20 pt-3 flex flex-col gap-1">
                        <p className="text-cyber-red font-bold uppercase tracking-wider">[ SEARCHING ]</p>
                      </div>
                    )}

                    {scanResultRevealed && (
                      <div className="border-t border-dashed border-cyber-red/20 pt-4 space-y-4 animate-[fadeIn_0.5s_ease-out]">
                        <p className="text-cyber-red font-bold uppercase tracking-wider">[ RESULT FOUND ]</p>
                        <div className="flex items-start">
                          <AsciiHeart />
                          <div className="grid grid-cols-12 gap-x-3 gap-y-1.5 text-white/95 flex-1 text-xs md:text-sm">
                            <span className="col-span-4 text-white/40">Owner</span>
                            <span className="col-span-8 text-white font-medium">: Yasha</span>
                            <span className="col-span-4 text-white/40">Heart ID</span>
                            <span className="col-span-8 text-amber-500 font-bold">: 100% Mine</span>
                            <span className="col-span-4 text-white/40">Connection</span>
                            <span className="col-span-8 text-white font-medium">: Permanent</span>
                            <span className="col-span-4 text-white/40">Status</span>
                            <span className="col-span-8 text-cyber-red font-bold glow-red">: Transferred Successfully</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Inner Page 2 Centered Enter Navigation */}
                  {scanResultRevealed && (
                    <div className="flex items-center justify-center py-2 border-t border-cyber-red/10 animate-pulse text-xs text-white/70 tracking-widest gap-2 font-mono">
                      Press <span className="text-cyber-red font-bold">ENTER</span> To Continue...
                      <span className="w-2 h-4 bg-cyber-red inline-block" />
                    </div>
                  )}
                </div>

                {/* Right Side: Heart Box (Col 4) */}
                <div className="md:col-span-4 flex flex-col items-center justify-center">
                  <div className="w-full aspect-square md:w-56 md:h-56 border border-dashed border-cyber-red/30 p-4 rounded-xl flex flex-col items-center justify-center relative bg-cyber-red/[0.02] shadow-[inset_0_0_15px_rgba(255,18,18,0.02)]">
                    {/* Corner bracket notches */}
                    <div className="absolute top-1.5 left-1.5 text-[10px] text-cyber-red/40">┌</div>
                    <div className="absolute top-1.5 right-1.5 text-[10px] text-cyber-red/40">┐</div>
                    <div className="absolute bottom-1.5 left-1.5 text-[10px] text-cyber-red/40">└</div>
                    <div className="absolute bottom-1.5 right-1.5 text-[10px] text-cyber-red/40">┘</div>
                    
                    <div className="w-full h-full">
                      <HolographicHeart color="red" />
                    </div>
                  </div>
                  <div className="text-center font-mono space-y-0.5 mt-4">
                    <p className="text-[9px] text-white/40 tracking-widest uppercase">HEART.LOCATOR v2.0</p>
                    <p className="text-xs text-cyber-red font-bold tracking-widest glow-red animate-pulse">
                      {scanResultRevealed ? "> SCAN COMPLETE" : "> SCANNING..."}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* PAGE 3: ACCESS GRANTED */}
          {terminalPage === 3 && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                handlePageClick();
              }}
              className="flex-1 w-full max-w-4xl border border-cyber-red/35 bg-black/90 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col glow-red-border mt-4 cursor-pointer select-none"
            >
              {/* Window Top Bar */}
              <div className="flex items-center justify-between px-4 py-3 bg-zinc-950/90 border-b border-cyber-red/25 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                  </div>
                  <span className="text-white/60 ml-2 font-mono">project_yasha.exe</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-cyber-red glow-red">
                  SYSTEM MONITOR
                  <span className="w-2 h-2 rounded-full bg-cyber-red animate-ping inline-block" />
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-6 md:p-8 font-mono text-xs md:text-sm">
                
                {/* Left Side: Typed Commands (Col 7) */}
                <div className="md:col-span-7 flex flex-col justify-between h-[280px] md:h-[400px]">
                  <div className="space-y-5">
                    {cmdLogs.map((item, i) => (
                      <div key={i} className="space-y-1.5">
                        <p className="text-cyber-red/80 font-bold">{item.typed}</p>
                        {item.done && (
                          <p className={`pl-4 font-semibold ${item.isPink ? "text-pink-500 glow-red" : "text-white"}`}>
                            {item.res}
                          </p>
                        )}
                      </div>
                    ))}
                    
                    {/* Active Blinking Cursor at the end */}
                    {cmdIndex < cmdLogs.length ? (
                      <span className="inline-block w-2 h-4 bg-cyber-red animate-pulse" />
                    ) : (
                      <p className="text-cyber-red/80 font-bold">
                        {`> `}
                        <span className="inline-block w-2 h-4 bg-cyber-red animate-pulse" />
                      </p>
                    )}
                  </div>

                  <div className="h-6 flex items-center text-white/30 border-t border-white/5 pt-2 text-[10px]">
                    Authentication protocol confirmed
                  </div>
                </div>

                {/* Right Side: Access Box & Continue (Col 5) */}
                <div className="md:col-span-5 flex flex-col items-center justify-between h-[260px] md:h-[400px] py-4">
                  {/* Glowing heart with floating mini hearts */}
                  <div className="w-full flex-1 flex flex-col items-center justify-center relative">
                    
                    {/* Floating Heart Particles in the Right Col */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      {Array.from({ length: 12 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="absolute text-pink-500/70 text-xs animate-[float_4s_infinite_ease-in-out]"
                          style={{
                            bottom: "20%",
                            left: `${20 + Math.random() * 60}%`,
                            animationDelay: `${idx * 0.45}s`,
                            animationDuration: `${3 + Math.random() * 2}s`
                          }}
                        >
                          ❤️
                        </div>
                      ))}
                    </div>

                    {/* Centered Glowing ASCII Heart */}
                    <div className="relative z-10 scale-[1.6]">
                      <AsciiHeart />
                    </div>
                  </div>

                  {/* Access Granted Green Box & Continue Button */}
                  {showAccessButton && (
                    <div className="w-full space-y-4 animate-[scaleUp_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)]">
                      <div className="border border-cyber-green bg-cyber-green/10 text-cyber-green rounded-xl py-3 px-5 text-center font-mono glow-green-border font-semibold">
                        <p className="text-lg font-bold tracking-widest">ACCESS GRANTED</p>
                        <p className="text-[10px] text-white/80 mt-0.5">Welcome to Project Yasha.exe</p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent container click duplication
                          triggerDreamTransition();
                        }}
                        className="w-full py-3 bg-gradient-to-r from-cyber-red to-pink-600 hover:from-pink-600 hover:to-cyber-red text-white font-mono font-bold tracking-widest rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(255,18,18,0.5)] cursor-pointer hover:scale-[1.02] flex items-center justify-center gap-2 group text-xs uppercase"
                      >
                        CONTINUE
                        <span className="group-hover:translate-x-1 transition-transform font-bold">&gt;</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Bottom Footer navigation info */}
          {terminalPage === 1 && (
            <div className="w-full flex flex-col items-center gap-1 mt-4 select-none">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerPage2();
                }}
                className="flex items-center gap-2 px-6 py-2.5 border border-cyber-red/40 hover:bg-cyber-red/15 font-mono text-xs uppercase tracking-widest cursor-pointer transition-all text-white animate-pulse"
              >
                Press ENTER to continue
              </button>
              <ChevronDown className="w-4 h-4 animate-bounce text-cyber-red/60 mt-1" />
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* ACT 2: CINEMATIC GSAP TRANSITION                        */}
      {/* ======================================================== */}
      {act === 2 && (
        <div
          ref={transitionScreenRef}
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#050505] overflow-hidden"
        >
          {/* Hacker UI Fragments breaking apart */}
          <div ref={textFragRef} className="text-[#ff1212] font-mono text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-widest uppercase animate-pulse">DECRYPTING PROTOCOL...</h2>
            <p className="text-xs text-white/50">Heart matrix dissolving. Reassembling aesthetic elements.</p>
            <div className="w-64 h-1 border border-cyber-red/30 mx-auto overflow-hidden">
              <div className="h-full bg-cyber-red animate-[loading_1.5s_infinite]" style={{ width: "60%" }} />
            </div>
          </div>

          {/* Shooting Star Trail */}
          <div
            ref={shootingStarRef}
            className="absolute top-1/4 left-0 w-32 h-[3px] bg-gradient-to-r from-transparent via-pink-400 to-white blur-[1px]"
            style={{ transform: "rotate(-25deg)" }}
          />

          {/* Floating Pink Particles */}
          <div className="absolute inset-0 pointer-events-none opacity-60">
            {pinkParticles.map((pt, i) => (
              <div
                key={i}
                className="absolute w-2.5 h-2.5 rounded-full bg-pink-300 opacity-80 blur-[0.5px]"
                style={{
                  top: pt.top,
                  left: pt.left,
                  animation: `float ${pt.duration} infinite ease-in-out ${pt.delay}`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ACT 3: EDITORIAL ROMANTIC DREAM WORLD (SCROLLABLE)      */}
      {/* ======================================================== */}
      {act === 3 && (
        <div className="min-h-screen bg-gradient-to-b from-white via-[#f2eee3] to-[#fff2f5] text-zinc-900 selection:bg-pink-100 relative">
          
          {/* Global Dream Overlay Elements */}
          <div className="fixed inset-0 pointer-events-none z-0">
            {/* Soft pink clouds around the edges */}
            <div className="absolute top-0 left-0 w-full h-[30vh] bg-gradient-to-b from-pink-50/50 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-[30vh] bg-gradient-to-t from-pink-50/50 to-transparent" />
            
            {/* Floating micro stars */}
            {microStars.map((star, i) => (
              <div
                key={i}
                className="absolute bg-pink-300 rounded-full opacity-60"
                style={{
                  width: star.size,
                  height: star.size,
                  top: star.top,
                  left: star.left,
                  animation: `twinkle ${star.duration} infinite ease-in-out ${star.delay}`,
                }}
              />
            ))}
          </div>

          {/* Persistent Romantic Header */}
          <header className="fixed top-0 left-0 w-full px-3 py-3 md:px-6 md:py-4 flex justify-between items-center z-[100] font-mono text-[9px] md:text-xs text-zinc-900 bg-white/80 backdrop-blur-md border-b border-pink-100/20 uppercase tracking-wider shadow-[0_2px_12px_rgba(244,63,94,0.03)]">
            <span>project_yasha.exe</span>
            {(() => {
              const displayBPM = isYashaHovered ? 138 : yesClicked ? 145 : gameActive ? 118 : bloomActive ? 98 : 72;
              return (
                <span className="flex items-center gap-1.5 font-bold text-pink-600">
                  <Heart className={`w-3.5 h-3.5 fill-pink-500 text-pink-500 ${
                    displayBPM > 100 ? "animate-[heartbeat_0.45s_infinite]" : "animate-[heartbeat_1.1s_infinite]"
                  }`} />
                  <span className="hidden md:inline">System Status : </span>In Love ({displayBPM} BPM)
                </span>
              );
            })()}
          </header>

          {/* ============================== */}
          {/* PAGE 5: BEFORE YOU             */}
          {/* ============================== */}
          <section className="h-screen relative flex flex-col items-center justify-center pt-20 md:pt-28 pb-8 px-4 md:px-6 z-10 text-zinc-900">
            {/* Background Video (Only in 1st section) */}
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0 opacity-100 select-none"
            >
              <source src="/bg-video.webm" type="video/webm" />
            </video>
            
            {/* Parallax Cloud SVG Vectors (React to mouse move parallax) */}
            <div 
              style={{
                transform: `translate(${-mousePos.x * 0.9}px, ${-mousePos.y * 0.9}px)`,
                transition: "transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              }}
              className="absolute -left-20 top-20 w-80 h-40 bg-pink-100/20 rounded-full filter blur-3xl opacity-60 animate-[float_8s_infinite_ease-in-out] z-0 hidden md:block" 
            />
            <div 
              style={{
                transform: `translate(${mousePos.x * 0.9}px, ${mousePos.y * 0.9}px)`,
                transition: "transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              }}
              className="absolute -right-20 bottom-20 w-96 h-50 bg-pink-100/20 rounded-full filter blur-3xl opacity-60 animate-[float_10s_infinite_ease-in-out_1s] z-0 hidden md:block" 
            />

            {/* Split Grid Container */}
            <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center z-10 relative">
              
              {/* Left Column: Text (Col 6) */}
              <div 
                style={{
                  transform: `translate(${mousePos.x * 0.2}px, ${mousePos.y * 0.2}px)`,
                  transition: "transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                }}
                className="md:col-span-6 text-center md:text-left space-y-8"
              >
                <h2 className="font-editorial text-4xl md:text-7xl lg:text-8xl tracking-tight leading-none select-none text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
                  Before you,<br />
                  life was <span className="relative inline-block text-pink-500 font-editorial-body italic font-bold border-b-4 border-pink-400/60 pb-1 px-1">
                    normal.
                    <span className="absolute -top-3 -right-6 text-pink-400 text-sm animate-pulse">💕</span>
                  </span>
                </h2>
                
                <div className="font-editorial-body text-xl md:text-2xl lg:text-3xl max-w-xl mx-auto md:mx-0 space-y-6 leading-relaxed select-none">
                  <p className="animate-[fadeIn_1s_ease-out_0.5s_both] font-medium text-white/95 drop-shadow-[0_1.5px_6px_rgba(0,0,0,0.35)]">
                    Just another boy,<br />
                    living in a world full of people<br />
                    and empty of meaning.
                  </p>
                  
                  {/* Horizontal Divider Heart Line */}
                  <div className="flex items-center justify-center md:justify-start gap-2 py-2 select-none">
                    <div className="w-16 h-[1.5px] bg-white/25" />
                    <span className="text-pink-400 text-xs">❤</span>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="font-bold text-white/85 text-xl md:text-2xl lg:text-3xl animate-[fadeIn_1s_ease-out_1.2s_both] italic drop-shadow-[0_1.5px_6px_rgba(0,0,0,0.35)]">
                      Then one day...
                    </p>
                    <p className="font-bold text-white/95 text-2xl md:text-3xl lg:text-4xl animate-[fadeIn_1s_ease-out_1.8s_both] drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                      a girl named <span onMouseEnter={handleYashaMouseEnter} onMouseLeave={handleYashaMouseLeave} className="yasha-name text-pink-500 border-b-4 border-pink-400 px-2 font-editorial italic text-3xl md:text-4xl lg:text-5xl relative inline-block transition-all duration-300">
                        Yasha
                        {isYashaHovered && (
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-pink-500 text-3xl animate-[heartbeat_0.5s_infinite] pointer-events-none select-none">
                            ❤️
                          </span>
                        )}
                        {/* Hand-drawn Sparkles SVG on Yasha */}
                        <svg className="absolute -top-1.5 -right-3.5 w-3.5 h-3.5 text-pink-400 animate-pulse" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                          <path d="M1,7 L3,5" />
                          <path d="M5,8 L5,5" />
                          <path d="M8,7 L6,5" />
                        </svg>
                      </span> appeared.
                    </p>
                  </div>
                </div>

                {/* Begin Our Story Button */}
                <div className="flex justify-center md:justify-start pt-4 animate-[fadeIn_1s_ease-out_2.4s_both]">
                  <button
                    onClick={() => {
                      bloomSectionRef.current?.scrollIntoView({ behavior: "smooth" });
                      if (!muted) synth.playAccessGrantedChime();
                    }}
                    className="px-6 py-3 bg-[#42222d]/65 hover:bg-[#592c3d]/80 border-2 border-pink-400/80 rounded-full shadow-[0_0_25px_rgba(244,63,94,0.35)] hover:shadow-[0_0_35px_rgba(244,63,94,0.5)] transition-all hover:scale-105 active:scale-95 duration-200 flex items-center justify-between gap-4 w-fit select-none cursor-pointer relative overflow-hidden group z-20"
                  >
                    <div className="absolute inset-0 w-1/2 h-full bg-white/10 skew-x-12 -translate-x-full group-hover:translate-x-[250%] transition-transform duration-1000 ease-out" />
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-pink-500 flex items-center justify-center text-white shadow-inner flex-shrink-0 animate-[pulse_2s_infinite]">
                        <Heart className="w-3.5 h-3.5 fill-current" />
                      </div>
                      <span className="font-mono text-xs font-bold tracking-widest text-white">BEGIN OUR STORY</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-pink-300 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Right Column: Illustration (Col 6) */}
              <div className="md:col-span-6 flex items-center justify-center h-[250px] md:h-[620px] lg:h-[720px] relative z-10 select-none">
                {/* 3D Depth Glow Background Layer */}
                <div 
                  style={{
                    transform: `translate(${-mousePos.x * 0.5}px, ${-mousePos.y * 0.5}px) scale(0.95)`,
                    transition: "transform 0.2s ease-out, opacity 0.8s ease-in-out",
                  }}
                  className={`absolute w-72 h-72 md:w-96 md:h-96 rounded-full filter blur-[60px] opacity-45 pointer-events-none transition-colors duration-1000 ${
                    isYashaHovered ? "bg-pink-400/35" : "bg-pink-300/15"
                  }`}
                />

                {/* 3D Tilting Image Container */}
                <div
                  style={{
                    transform: `perspective(1000px) rotateY(${mousePos.x * 0.5}deg) rotateX(${-mousePos.y * 0.5}deg) translateZ(30px)`,
                    transformStyle: "preserve-3d",
                    transition: "transform 0.2s ease-out",
                  }}
                  className="w-full h-full flex items-center justify-center relative pointer-events-none"
                >
                  <img
                    src="/boy.png"
                    alt="Boy Illustration"
                    className={`absolute h-full object-contain transition-all duration-1000 ease-in-out [transform-style:preserve-3d] [backface-visibility:hidden] ${
                      isYashaHovered ? "opacity-0 scale-95 rotate-[-3deg] blur-[4px]" : "opacity-100 scale-100 rotate-0 blur-0"
                    }`}
                    style={{
                      transform: "translateZ(40px)",
                    }}
                  />
                  <img
                    src="/couple.png"
                    alt="Couple Illustration"
                    className={`absolute h-full object-contain transition-all duration-1000 ease-in-out rounded-2xl [transform-style:preserve-3d] [backface-visibility:hidden] ${
                      isYashaHovered ? "opacity-100 scale-100 rotate-0 blur-0" : "opacity-0 scale-105 rotate-[3deg] blur-[4px]"
                    }`}
                    style={{
                      transform: "translateZ(40px)",
                    }}
                  />
                </div>
              </div>

            </div>

            {/* Scroll Down Indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[9px] font-mono tracking-[0.25em] text-white/70 uppercase z-10 select-none pointer-events-none">
              <span>Scroll Down</span>
              <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center animate-bounce shadow-sm bg-white/5 backdrop-blur-sm">
                <ChevronDown className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Bottom Left Corner: Logo N */}
            <div className="absolute bottom-6 left-6 z-20 select-none pointer-events-none">
              {/* Circular Badge N */}
              <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold font-sans text-sm shadow-md">
                N
              </div>
            </div>
          </section>

          {/* ============================== */}
          {/* PAGE 6: THE IMPACT (BLOOM)     */}
          {/* ============================== */}
          <section
            ref={bloomSectionRef}
            className="h-screen relative flex flex-col items-center justify-center p-6 z-10"
          >
            {/* Header Content */}
            <div className="text-center space-y-4 mb-10 select-none animate-[fadeIn_1s_ease-out]">
              <h2 className="font-editorial text-3xl md:text-6xl tracking-tight text-zinc-950 font-bold leading-tight drop-shadow-[0_2px_8px_rgba(255,255,255,0.85)]">
                And suddenly,<br />
                everything changed.
              </h2>
              
              {/* Pulsing Pink Heart Icon */}
              <div className="flex justify-center items-center py-1.5">
                <Heart className="w-5 h-5 text-pink-500 fill-pink-500 animate-[pulse_1.2s_infinite]" />
              </div>
              
              {/* Subheading */}
              <p className="font-mono text-xs md:text-sm tracking-widest text-zinc-900 font-semibold uppercase drop-shadow-[0_1px_4px_rgba(255,255,255,0.8)]">
                The story of Yasha — before and <span className="text-pink-600 font-bold">after</span>.
              </p>
            </div>

            {/* Cards Grid with Center Connector */}
            <div className="relative w-full max-w-4xl mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row items-stretch justify-center gap-6 md:gap-16">
              
              {/* Center Connector Node (Desktop absolute centering, mobile inline) */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center z-20 pointer-events-none">
                {/* Glowing Concentric Pulse Rings */}
                <div className={`absolute w-16 h-16 rounded-full border-2 border-pink-200 bg-pink-100/30 transition-all duration-1000 ${
                  bloomActive ? "animate-[ping_2s_infinite] opacity-60" : "opacity-0"
                }`} />
                <div className={`absolute w-12 h-12 rounded-full bg-pink-200/50 transition-all duration-1000 ${
                  bloomActive ? "animate-pulse opacity-80" : "opacity-0"
                }`} />
                
                {/* Core Connector Heart */}
                <div className={`w-14 h-14 rounded-full border-2 transition-all duration-1000 flex items-center justify-center shadow-md ${
                  bloomActive 
                    ? "bg-pink-500 border-pink-300 scale-110 shadow-pink-200" 
                    : "bg-zinc-200 border-zinc-300 scale-100"
                }`}>
                  <Heart className={`w-5 h-5 text-white fill-white ${bloomActive ? "animate-[pulse_1s_infinite]" : ""}`} />
                </div>
              </div>

              {/* Left Card: BEFORE YASHA */}
              <div className="flex-1 bg-white border-2 border-zinc-400 shadow-[4px_4px_0px_#a1a1aa] md:shadow-[8px_8px_0px_#a1a1aa] rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#71717a] md:hover:shadow-[12px_12px_0px_#71717a] hover:border-zinc-500 relative group z-10 opacity-100">
                <div className="space-y-6">
                  {/* Badge */}
                  <div>
                    <span className="inline-block px-3.5 py-1 bg-zinc-100 rounded-full font-mono text-[9px] font-bold tracking-widest text-zinc-700 border border-zinc-350/50">
                      BEFORE YASHA
                    </span>
                  </div>
                  
                  {/* Title */}
                  <h3 className="font-editorial text-2xl md:text-3xl italic text-zinc-900 font-bold leading-tight">
                    A monochrome world
                  </h3>
                  
                  {/* Paragraph */}
                  <p className="font-editorial-body text-zinc-700 text-sm md:text-base font-medium leading-relaxed text-left">
                    Quiet, standard routines.<br />
                    Dark terminals. Ordinary<br />
                    dreams.
                  </p>
                </div>
                
                {/* Footer */}
                <div className="flex items-center gap-3 mt-6 md:mt-10 text-zinc-800 font-bold select-none">
                  <div className="w-9 h-9 rounded-full border-2 border-zinc-350 flex items-center justify-center bg-zinc-50">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider font-bold">View chapter</span>
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1 duration-300" />
                </div>
              </div>

              {/* Mobile Connector (visible only on small screens) */}
              <div className="flex md:hidden items-center justify-center my-2 relative z-20">
                <div className={`w-12 h-12 rounded-full border-2 transition-all duration-1000 flex items-center justify-center shadow-md ${
                  bloomActive ? "bg-pink-500 border-pink-300 shadow-pink-200 scale-105" : "bg-zinc-200 border-zinc-300"
                }`}>
                  <Heart className={`w-4.5 h-4.5 text-white fill-white ${bloomActive ? "animate-pulse" : ""}`} />
                </div>
              </div>

              {/* Right Card: AFTER YASHA */}
              <div className={`flex-1 flex flex-col justify-between transition-all duration-300 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-8 relative group z-10 border-2 ${
                bloomActive 
                  ? "bg-pink-50 border-pink-400 shadow-[4px_4px_0px_#f43f5e] md:shadow-[8px_8px_0px_#f43f5e] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#e11d48] md:hover:shadow-[12px_12px_0px_#e11d48] hover:border-pink-500 saturate-100 opacity-100" 
                  : "bg-white border-zinc-300 shadow-[4px_4px_0px_#d4d4d8] md:shadow-[8px_8px_0px_#d4d4d8] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#a1a1aa] md:hover:shadow-[12px_12px_0px_#a1a1aa] hover:border-zinc-400 grayscale saturate-0 opacity-80"
              }`}>
                {/* Floating sparkle badge in top right (only when active) */}
                {bloomActive && (
                  <div className="absolute -top-3.5 -right-3.5 w-8.5 h-8.5 rounded-full bg-pink-500 flex items-center justify-center shadow-md shadow-pink-200 z-20 animate-[float_4s_infinite_ease-in-out]">
                    <Sparkles className="w-4.5 h-4.5 text-white fill-white" />
                  </div>
                )}
                
                <div className="space-y-6">
                  {/* Badge */}
                  <div>
                    <span className={`inline-block px-3.5 py-1 rounded-full font-mono text-[9px] font-bold tracking-widest border transition-all duration-300 ${
                      bloomActive 
                        ? "bg-pink-100 text-pink-600 border-pink-300/50" 
                        : "bg-zinc-100 text-zinc-700 border-zinc-300/50"
                    }`}>
                      AFTER YASHA
                    </span>
                  </div>
                  
                  {/* Title */}
                  <h3 className={`font-editorial text-2xl md:text-3xl italic font-bold leading-tight transition-colors duration-300 ${
                    bloomActive ? "text-pink-700" : "text-zinc-800"
                  }`}>
                    A beautiful pink bloom
                  </h3>
                  
                  {/* Paragraph */}
                  <p className={`font-editorial-body text-sm md:text-base font-medium leading-relaxed text-left transition-colors duration-300 ${
                    bloomActive ? "text-zinc-800" : "text-zinc-700"
                  }`}>
                    Brimming with laughter.<br />
                    Warm colors. Magical<br />
                    connections.
                  </p>
                </div>
                
                {/* Footer */}
                <div className={`flex items-center gap-3 mt-6 md:mt-10 transition-colors duration-300 select-none ${
                  bloomActive ? "text-pink-750 font-bold" : "text-zinc-800 font-bold"
                }`}>
                  <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    bloomActive ? "border-pink-300 bg-pink-50" : "border-zinc-300 bg-zinc-50"
                  }`}>
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider font-bold">View chapter</span>
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1 duration-300" />
                </div>
              </div>

            </div>

            {/* Scroll indicator for the section */}
            <div className={`absolute bottom-8 flex flex-col items-center gap-1.5 text-[10px] font-mono tracking-widest text-zinc-400 uppercase z-10 transition-all duration-1000 ${
              bloomActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}>
              <span>Scroll to explore</span>
              <ArrowDown className="w-4 h-4 bounce text-pink-500 mt-1" />
            </div>
          </section>

          {/* ============================== */}
          {/* PAGE 7: REASONS I LOVE YOU     */}
          {/* ============================== */}
          <section className="h-screen relative flex flex-col items-center justify-center py-10 px-6 z-10 bg-transparent overflow-hidden">
            <div className="max-w-5xl w-full text-center space-y-8 relative">
              <div className="space-y-4">
                {/* Reasons.exe badge */}
                <div className="flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-widest text-pink-600 font-bold drop-shadow-[0_1px_4px_rgba(255,255,255,0.8)]">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block animate-ping absolute opacity-30" />
                  <span className="w-2 h-2 rounded-full bg-pink-500 inline-block relative" />
                  REASONS.EXE
                </div>
                
                {/* Title */}
                <h2 className="font-editorial text-3xl md:text-6xl tracking-tight text-zinc-950 font-bold leading-[1.2] relative max-w-2xl mx-auto select-none drop-shadow-[0_2px_8px_rgba(255,255,255,0.85)]">
                  {/* Left hand-drawn sparks */}
                  <span className="absolute left-[-2rem] md:left-[-3.5rem] top-[45%] -translate-y-1/2 text-pink-500 hidden sm:inline-block rotate-[-15deg] animate-[pulse_2s_infinite]">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M5 12h3M7 8l2 2M10 6v3" />
                    </svg>
                  </span>
                  Why you make{" "}
                  <svg className="w-9 h-9 md:w-12 md:h-12 text-pink-500 fill-none stroke-[1.5] inline-block ml-1 align-middle rotate-12 animate-[pulse_1.5s_infinite]" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <br />
                  my world complete
                </h2>
                
                {/* Subtitle */}
                <p className="font-mono text-zinc-900 text-xs md:text-sm tracking-wide font-semibold italic select-none drop-shadow-[0_1px_4px_rgba(255,255,255,0.8)]">
                  Hover or tap cards to open them
                </p>
              </div>

              {/* Slider Wrapper */}
              <div className="flex items-center justify-center gap-2 md:gap-6 max-w-5xl mx-auto w-full pt-4 relative px-2 md:px-6">
                
                {/* Left Arrow Button */}
                <button
                  onClick={() => {
                    setActiveReasonIndex((prev) => (prev === 0 ? 4 : prev - 1));
                    if (!muted) synth.playTypewriterClick();
                  }}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border-2 border-zinc-350 flex items-center justify-center shadow-[4px_4px_0px_#f43f5e] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#f43f5e] text-pink-600 hover:bg-pink-50 transition-all cursor-pointer select-none z-20 flex-shrink-0"
                >
                  <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                </button>

                {/* Cards Container */}
                <div 
                  className="flex-1 py-4 flex flex-col md:flex-row items-stretch justify-center gap-3 md:gap-4 max-w-4xl mx-auto w-full h-[360px] md:h-[400px] overflow-hidden"
                >
                  {[
                    { 
                      id: "01.exe", 
                      title: "Your Smile", 
                      desc: "It brightens even the darkest days.",
                      image: "/section 3/smile.png",
                      icon: <Smile className="w-8 h-8 md:w-10 md:h-10 text-pink-600 stroke-[1.5]" />,
                      bgGradient: "from-pink-50/20 to-rose-50/20"
                    },
                    { 
                      id: "02.exe", 
                      title: "Your Eyes", 
                      desc: "They hold a universe of warmth and beauty.",
                      image: "/section 3/eyes.png",
                      icon: (
                        <svg className="w-8 h-8 md:w-10 md:h-10 text-pink-600 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ),
                      bgGradient: "from-purple-50/20 to-pink-50/20"
                    },
                    { 
                      id: "03.exe", 
                      title: "Your Kindness", 
                      desc: "It touches hearts in ways you don't even realize.",
                      icon: <Heart className="w-8 h-8 md:w-10 md:h-10 text-pink-600 fill-none stroke-[1.5]" />,
                      bgGradient: "from-red-50/20 to-pink-50/20"
                    },
                    { 
                      id: "04.exe", 
                      title: "Your Chaos", 
                      desc: "It's messy, chaotic, and somehow perfect.",
                      icon: (
                        <svg className="w-8 h-8 md:w-10 md:h-10 text-pink-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M12 2C16.5 2 20 4.5 20 7C20 9.5 16 11 12 11C8 11 4 12.5 4 15C4 17.5 8 19 12 19C16 19 20 20 20 22" />
                        </svg>
                      ),
                      bgGradient: "from-amber-50/20 to-pink-50/20"
                    },
                    { 
                      id: "05.exe", 
                      title: "Everything", 
                      desc: "All of it. Every little thing. Always.",
                      icon: (
                        <svg className="w-8 h-8 md:w-10 md:h-10 text-pink-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2c0 5.5 4.5 10 10 10c-5.5 0-10 4.5-10 10c0-5.5-4.5-10-10-10c5.5 0 10-4.5 10-10z" fill="currentColor" fillOpacity="0.1" />
                        </svg>
                      ),
                      bgGradient: "from-pink-50/20 to-indigo-50/20"
                    },
                  ].map((reason, i) => {
                    const isActive = activeReasonIndex === i;
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          setActiveReasonIndex(i);
                          if (!muted && !isActive) synth.playTypewriterClick();
                        }}
                        className={`rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 text-center flex flex-col justify-between cursor-pointer transition-all duration-300 relative group overflow-hidden select-none border-2 ${
                          isActive 
                            ? "flex-[3.5] bg-white border-pink-400 shadow-[4px_4px_0px_#f43f5e] md:shadow-[8px_8px_0px_#f43f5e] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#e11d48] md:hover:shadow-[12px_12px_0px_#e11d48] hover:border-pink-500 z-10" 
                            : "flex-[0.8] bg-zinc-100 border-zinc-300 shadow-[2px_2px_0px_#d4d4d8] md:shadow-[4px_4px_0px_#d4d4d8] hover:bg-pink-50/70 hover:border-pink-350 hover:shadow-[4px_4px_0px_#f43f5e] md:hover:shadow-[6px_6px_0px_#f43f5e] hover:-translate-x-0.5 hover:-translate-y-0.5 z-0"
                        }`}
                      >
                        {/* Ambient background glow inside active card */}
                        {isActive && (
                          <div className={`absolute inset-0 bg-gradient-to-br ${reason.bgGradient} opacity-60 pointer-events-none`} />
                        )}

                        {/* Top Row: ID Badge */}
                        <div className="w-full flex justify-between items-center relative z-10">
                          <span className={`font-mono text-[9px] font-bold tracking-widest uppercase transition-colors duration-500 ${
                            isActive ? "text-pink-700" : "mx-auto md:mx-0 text-zinc-600"
                          }`}>
                            {reason.id}
                          </span>
                        </div>

                        {/* Center Content / Collapsed content */}
                        {isActive ? (
                          /* Expanded State Content */
                          <div className="flex-1 flex flex-col items-center justify-center space-y-6 relative z-10 animate-[fadeIn_0.5s_ease-out]">
                            {/* Large pulsing icon or image */}
                            <div className="w-24 h-24 md:w-44 md:h-44 rounded-full bg-pink-50/85 border-2 border-pink-100 flex items-center justify-center shadow-[0_0_25px_rgba(255,182,193,0.4)] animate-[pulse_3s_infinite] overflow-hidden">
                              {reason.image ? (
                                <img src={reason.image} alt={reason.title} className="w-full h-full object-cover scale-105" />
                              ) : (
                                <div className="scale-[2.4] md:scale-[3.2]">{reason.icon}</div>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Collapsed State Text (Rotated on desktop, normal on mobile) */
                          <div className="flex-1 flex items-center justify-center relative z-10 py-4">
                            <span className="font-mono text-[9px] md:text-[10px] font-bold tracking-[0.2em] text-zinc-750 uppercase md:[writing-mode:vertical-rl] md:rotate-180 select-none pointer-events-none">
                              {reason.title}
                            </span>
                          </div>
                        )}

                        {/* Bottom Footer Row */}
                        <div className="w-full relative z-10">
                          {isActive ? (
                            /* Expanded Footer Layout (similar to the Modernist Villa layout: Left text, Right arrow button) */
                            <div className="flex items-end justify-between text-left pt-2 border-t-2 border-pink-100/50 animate-[fadeIn_0.5s_ease-out]">
                              <div className="space-y-1 pr-4">
                                <h3 className="font-editorial text-lg md:text-xl font-bold text-zinc-950 leading-snug">
                                  {reason.title}
                                </h3>
                                <p className="font-editorial-body text-xs font-semibold text-zinc-700 leading-normal max-w-[200px] md:max-w-[240px]">
                                  {reason.desc}
                                </p>
                              </div>
                              
                              {/* Arrow Button */}
                              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-pink-500 border-2 border-pink-600 text-white flex items-center justify-center shadow-md shadow-pink-100 hover:bg-pink-600 transition-all duration-300 transform scale-105 flex-shrink-0">
                                <ArrowRight className="w-4 h-4" />
                              </div>
                            </div>
                          ) : (
                            /* Collapsed Footer Layout (Centered Icon or Image) */
                            <div className="flex justify-center pt-2">
                              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border-2 border-zinc-300 text-pink-500 flex items-center justify-center shadow-sm group-hover:border-pink-400 group-hover:bg-pink-50 transition-all duration-300 overflow-hidden">
                                {reason.image ? (
                                  <img src={reason.image} alt={reason.title} className="w-full h-full object-cover" />
                                ) : (
                                  reason.icon
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Arrow Button */}
                <button
                  onClick={() => {
                    setActiveReasonIndex((prev) => (prev === 4 ? 0 : prev + 1));
                    if (!muted) synth.playTypewriterClick();
                  }}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border border-zinc-100 flex items-center justify-center shadow-md text-pink-500 hover:bg-pink-50 hover:scale-105 active:scale-95 transition-all cursor-pointer select-none z-20 flex-shrink-0"
                >
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </button>

              </div>

              {/* Dot Indicators */}
              <div className="flex justify-center items-center gap-2 pt-2">
                {[0, 1, 2, 3, 4].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveReasonIndex(idx);
                      if (!muted) synth.playTypewriterClick();
                    }}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                      activeReasonIndex === idx ? "bg-pink-500 w-5" : "bg-zinc-200 hover:bg-zinc-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 flex flex-col items-center gap-1.5 text-[10px] font-mono tracking-widest text-zinc-400 uppercase z-10 select-none">
              <span>Scroll to continue</span>
              <ArrowDown className="w-4 h-4 bounce text-pink-500 mt-1" />
            </div>
          </section>

          {/* ============================== */}
          {/* PAGE 7.5: MINI-GAME            */}
          {/* ============================== */}
          <section ref={gameSectionRef} className="h-screen relative flex flex-col items-center justify-center p-6 z-10 bg-transparent">
            <LoveCatchGame 
              onComplete={() => {
                proposalSectionRef.current?.scrollIntoView({ behavior: "smooth" });
              }} 
              muted={muted} 
            />

            {/* Scroll Indicator */}
            <div className={`absolute bottom-8 flex flex-col items-center gap-1.5 text-[10px] font-mono tracking-widest text-zinc-400 uppercase z-10 transition-all duration-1000 ${
              gameActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}>
              <span>Scroll to continue</span>
              <ArrowDown className="w-4 h-4 bounce text-pink-500 mt-1" />
            </div>
          </section>

          {/* ============================== */}
          {/* PAGE 8: FINAL PROPOSAL         */}
          {/* ============================== */}
          <section ref={proposalSectionRef} className="h-screen relative flex flex-col items-center justify-center text-center p-6 z-10 bg-transparent">
            
            {/* Twinkling giant heart glow background */}
            <div className="absolute w-[300px] h-[300px] md:w-[450px] md:h-[450px] rounded-full bg-pink-100 filter blur-3xl opacity-70 animate-[pulse_3s_infinite]" />

            <div className="max-w-2xl space-y-8 md:space-y-12 relative">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 shadow-sm animate-bounce">
                  <Heart className="w-8 h-8 fill-current" />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="font-editorial text-4xl md:text-7xl tracking-tight leading-none text-zinc-950 font-bold select-none drop-shadow-[0_2px_8px_rgba(255,255,255,0.85)]">
                  Will You Be<br />
                  My Forever?
                </h2>
                <p className="font-editorial-body text-zinc-800 text-lg md:text-xl font-semibold italic drop-shadow-[0_1px_4px_rgba(255,255,255,0.8)]">
                  Let's lock in this connection permanently.
                </p>
              </div>

              {/* Choice Buttons */}
              <div className="flex flex-row items-center justify-center gap-6 pt-4 h-16 relative">
                <button
                  onClick={handleYes}
                  className="px-10 py-4 bg-pink-500 hover:bg-pink-600 border-2 border-pink-650 text-white font-mono font-bold tracking-widest cursor-pointer text-sm uppercase rounded-full shadow-[4px_4px_0px_#e11d48] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#e11d48] transition-all active:scale-95 duration-200 relative z-10"
                >
                  [ Y E S ]
                </button>

                <button
                  onMouseEnter={handleNoHover}
                  onClick={handleNoHover}
                  style={{
                    transform: `translate(${noBtnPos.x}px, ${noBtnPos.y}px)`,
                    transition: noHoverCount > 0 ? "transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275)" : "none",
                  }}
                  className="px-10 py-4 border-2 border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 font-mono tracking-widest cursor-pointer text-sm uppercase rounded-full shadow-[4px_4px_0px_#d4d4d8] select-none relative z-10"
                >
                  {noHoverCount > 10 ? "No (Error)" : "N o"}
                </button>
              </div>
            </div>

            {/* Proposal Successful Fullscreen Overlay Celebration */}
            {yesClicked && (
              <div className="fixed inset-0 z-[1000] bg-gradient-to-tr from-[#ffe4eb] via-[#fff0f3] to-[#fffafb] flex flex-col items-center justify-center p-4 md:p-6 animate-[fadeIn_0.6s_ease-out] select-text overflow-y-auto overflow-x-hidden">
                {/* Fall and Sway animation styles loaded dynamically */}
                <style>{`
                  @keyframes fallAndSway {
                    0% {
                      transform: translateY(-10vh) scale(var(--scale)) rotate(var(--rot-start));
                      opacity: 0;
                    }
                    10% {
                      opacity: 0.95;
                    }
                    90% {
                      opacity: 0.95;
                    }
                    100% {
                      transform: translateY(110vh) translateX(var(--sway-x)) scale(var(--scale)) rotate(var(--rot-end));
                      opacity: 0;
                    }
                  }
                `}</style>

                {/* Particle Firework canvas in the background */}
                <FireworkCelebration />

                {/* Floating Rose Petals Background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                  {successPetals.map((petal) => (
                    <div
                      key={`petal-${petal.id}`}
                      className="absolute bg-gradient-to-br from-pink-300 via-rose-400 to-rose-500 shadow-[inset_1.5px_1.5px_3px_rgba(255,255,255,0.45),_0_4px_8px_rgba(244,63,94,0.12)]"
                      style={{
                        left: `${petal.left}%`,
                        top: "-5%",
                        width: `${petal.size}px`,
                        height: `${petal.size}px`,
                        animationName: "fallAndSway",
                        animationTimingFunction: "linear",
                        animationIterationCount: "infinite",
                        animationDelay: `${petal.delay}s`,
                        animationDuration: `${petal.duration}s`,
                        borderRadius: "60% 10% 60% 10% / 60% 10% 60% 10%",
                        filter: `blur(${petal.blur}px)`,
                        "--scale": petal.scale,
                        "--rot-start": `${petal.rotate}deg`,
                        "--rot-end": `${petal.rotate + 180 + Math.random() * 360}deg`,
                        "--sway-x": `${Math.random() > 0.5 ? petal.sway : -petal.sway}px`,
                      } as React.CSSProperties}
                    />
                  ))}
                  
                  {/* Floating Gold Sparkle Dust */}
                  {successSparkles.map((sparkle) => (
                    <div 
                      key={`sparkle-${sparkle.id}`}
                      className="absolute bg-amber-300 rounded-full opacity-50 animate-[ping_3s_infinite]"
                      style={{
                        left: sparkle.left,
                        top: sparkle.top,
                        width: sparkle.size,
                        height: sparkle.size,
                        animationDelay: sparkle.delay,
                        animationDuration: `${2.5 + Math.random() * 2}s`
                      }}
                    />
                  ))}
                </div>

                {/* Left floating decorative 3D Heart */}
                <div className="absolute bottom-16 left-12 w-44 h-44 opacity-75 pointer-events-none select-none z-0 animate-[float_4.5s_infinite_ease-in-out] hidden xl:block">
                  <svg viewBox="0 0 24 24" className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(244,63,94,0.22)]">
                    <path 
                      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                      fill="url(#successHeart3d)" 
                    />
                    <ellipse cx="8" cy="7" rx="3.5" ry="1.8" fill="white" opacity="0.45" transform="rotate(-15, 8, 7)" />
                  </svg>
                </div>

                {/* Right floating decorative 3D Rose */}
                <div className="absolute bottom-6 right-8 w-56 h-56 opacity-85 pointer-events-none select-none z-0 animate-[float_5s_infinite_ease-in-out_1s] hidden xl:block">
                  <svg viewBox="0 0 200 200" className="w-full h-full filter drop-shadow-[0_10px_20px_rgba(244,63,94,0.15)]">
                    <defs>
                      <radialGradient id="leafGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#84cc16" />
                        <stop offset="100%" stopColor="#3f6212" />
                      </radialGradient>
                      <radialGradient id="petalGrad1" cx="40%" cy="40%" r="60%">
                        <stop offset="0%" stopColor="#ffd1dc" />
                        <stop offset="50%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#9f1239" />
                      </radialGradient>
                    </defs>
                    {/* Green Leaves */}
                    <path d="M70,135 Q50,155 30,140 Q50,120 70,135 Z" fill="url(#leafGrad)" />
                    <path d="M130,135 Q150,155 170,140 Q150,120 130,135 Z" fill="url(#leafGrad)" />
                    {/* Rose Petal Groups */}
                    <g fill="url(#petalGrad1)">
                      {/* Layer 1: Outer Petals */}
                      <path d="M100,50 C70,30 35,60 65,100 C35,140 70,170 100,150 C130,170 165,140 135,100 C165,60 130,30 100,50 Z" />
                      {/* Layer 2 */}
                      <path d="M100,62 C82,48 55,72 78,100 C55,128 82,152 100,138 C118,152 145,128 122,100 C145,72 118,48 100,62 Z" opacity="0.95" />
                      {/* Layer 3 */}
                      <path d="M100,74 C90,64 72,82 86,100 C72,118 90,132 100,123 C110,132 128,118 114,100 C128,82 110,64 100,74 Z" opacity="0.9" />
                      {/* Rose center cone */}
                      <ellipse cx="100" cy="100" rx="14" ry="12" fill="#fda4af" />
                      <path d="M92,95 C92,90 108,90 108,95 C108,105 92,105 92,95 Z" fill="#e11d48" />
                    </g>
                  </svg>
                </div>

                {/* You + Me = Forever cursive lettering on the top-left */}
                <div className="absolute top-24 left-12 font-editorial-body text-3xl text-pink-500/80 -rotate-12 select-none pointer-events-none z-0 hidden md:block">
                  <p className="font-editorial italic">You + Me</p>
                  <p className="pl-6 font-editorial italic">= Forever</p>
                  <svg className="w-8 h-8 text-pink-400/60 mt-2 ml-16 stroke-[1.5] fill-none animate-[pulse_2s_infinite]" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>

                {/* Card Container */}
                <div className="max-w-[460px] w-full bg-white border border-pink-100 rounded-[1.5rem] md:rounded-[3rem] shadow-[0_25px_60px_rgba(244,63,94,0.12)] relative z-10 flex flex-col p-4 md:p-8 text-center space-y-5 md:space-y-7 backdrop-blur-sm animate-[scaleUp_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)] select-text overflow-hidden">
                  
                  {/* Decorative envelope curved flap background */}
                  <div className="absolute top-0 left-0 w-full h-32 bg-transparent pointer-events-none z-0">
                    <svg className="absolute top-0 left-0 w-full h-full text-pink-50/60 fill-current" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path d="M0,0 L100,0 L100,32 Q50,64 0,32 Z" />
                    </svg>
                    <svg className="absolute top-0 left-0 w-full h-full text-pink-100/40 fill-none stroke-current stroke-[0.75]" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path d="M0,32 Q50,64 100,32" />
                    </svg>
                  </div>

                  {/* Centered Checkmark Heart & Rings (above the flap) */}
                  <div className="relative mt-2 md:mt-4 mb-1 md:mb-2 flex justify-center z-20">
                    <div className="relative w-20 h-20 flex items-center justify-center">
                      {/* Rings/orbit */}
                      <div className="absolute w-28 h-8 rounded-full border border-pink-400/35 rotate-[12deg] scale-y-[0.3] animate-[spin_10s_infinite_linear] pointer-events-none" />
                      <div className="absolute w-24 h-6 rounded-full border border-pink-500/20 -rotate-[8deg] scale-y-[0.25] animate-[spin_8s_infinite_linear_reverse] pointer-events-none" />
                      
                      {/* Floating Heart */}
                      <div className="w-18 h-18 relative animate-[float_3.5s_infinite_ease-in-out] drop-shadow-[0_8px_16px_rgba(244,63,94,0.35)]">
                        <svg viewBox="0 0 24 24" className="w-full h-full filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
                          <defs>
                            <radialGradient id="successHeart3d" cx="35%" cy="30%" r="65%">
                              <stop offset="0%" stopColor="#ffb3c6" />
                              <stop offset="30%" stopColor="#ff6b8b" />
                              <stop offset="75%" stopColor="#f43f5e" />
                              <stop offset="100%" stopColor="#be123c" />
                            </radialGradient>
                          </defs>
                          <path 
                            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
                            fill="url(#successHeart3d)" 
                          />
                          <ellipse cx="8" cy="7" rx="3.5" ry="1.8" fill="white" opacity="0.45" transform="rotate(-15, 8, 7)" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check className="w-8 h-8 text-white stroke-[4.5px] filter drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.25)]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Header Texts */}
                  <div className="space-y-3 relative z-10">
                    <div>
                      <span className="px-4 py-1 bg-[#fff0f2] border border-pink-200/50 text-pink-600 font-mono text-[9px] font-bold tracking-widest uppercase rounded-full inline-flex items-center gap-1.5 select-none relative">
                        ✦ MISSION SUCCESSFUL ✦
                      </span>
                    </div>
                    
                    <h2 className="font-editorial text-3xl md:text-4xl text-zinc-900 font-semibold tracking-tight">
                      Forever Locked In 💖
                    </h2>
                    <p className="font-editorial-body text-zinc-500 text-xs md:text-sm tracking-wide">
                      Our code. Our connection. Our forever.
                    </p>
                  </div>

                  {/* Detailed Information Box */}
                  <div className="border border-pink-100 bg-[#fcfafb]/95 rounded-2xl p-4 md:p-5 text-left space-y-3 relative z-10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]">
                    
                    {/* Row 1: Project */}
                    <div className="flex flex-col gap-1.5 md:grid md:grid-cols-12 md:items-center py-1.5 md:py-1 border-b border-pink-100/30">
                      <div className="md:col-span-5 flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 rounded-xl bg-pink-50/70 text-pink-500 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="font-sans text-xs md:text-sm text-zinc-600 font-bold">Project</span>
                      </div>
                      <div className="hidden md:block md:col-span-1 text-center text-zinc-400 font-mono text-xs">:</div>
                      <div className="md:col-span-6 flex items-center justify-start md:justify-end gap-2 pl-10 md:pl-0">
                        <span className="font-mono text-xs md:text-sm font-bold text-zinc-800">yasha_proposal.exe</span>
                        <div className="relative flex items-center ml-2">
                          {copied ? (
                            <>
                              <span className="absolute -top-7 right-0 text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-sans font-bold shadow-sm whitespace-nowrap animate-[fadeIn_0.2s_ease-out]">Copied!</span>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            </>
                          ) : (
                            <Copy 
                              className="w-3.5 h-3.5 text-zinc-400 hover:text-pink-500 cursor-pointer transition-colors" 
                              onClick={handleCopyProjectName} 
                              title="Copy file name"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Connection Status */}
                    <div className="flex flex-col gap-1.5 md:grid md:grid-cols-12 md:items-center py-1.5 md:py-1 border-b border-pink-100/30">
                      <div className="md:col-span-5 flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 rounded-xl bg-pink-50/70 text-pink-500 flex items-center justify-center flex-shrink-0">
                          <Link2 className="w-4 h-4" />
                        </div>
                        <span className="font-sans text-xs md:text-sm text-zinc-600 font-bold">Connection Status</span>
                      </div>
                      <div className="hidden md:block md:col-span-1 text-center text-zinc-400 font-mono text-xs">:</div>
                      <div className="md:col-span-6 flex items-center justify-start md:justify-end gap-2 pl-10 md:pl-0">
                        <span className="font-sans text-xs md:text-sm font-bold text-pink-500 uppercase tracking-widest">FOREVER</span>
                        <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500 animate-[heartbeat_1s_infinite]" />
                      </div>
                    </div>

                    {/* Row 3: Execution Status */}
                    <div className="flex flex-col gap-1.5 md:grid md:grid-cols-12 md:items-center py-1.5 md:py-1">
                      <div className="md:col-span-5 flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 rounded-xl bg-pink-50/70 text-pink-500 flex items-center justify-center flex-shrink-0">
                          <TermIcon className="w-4 h-4" />
                        </div>
                        <span className="font-sans text-xs md:text-sm text-zinc-600 font-bold">Execution Status</span>
                      </div>
                      <div className="hidden md:block md:col-span-1 text-center text-zinc-400 font-mono text-xs">:</div>
                      <div className="md:col-span-6 flex items-center justify-start md:justify-end gap-2 pl-10 md:pl-0">
                        <span className="font-mono text-[10px] md:text-xs font-bold text-emerald-500 uppercase tracking-wider">COMPLETED SUCCESSFULLY</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                    </div>
                  </div>

                  {/* Quoted Proposal Message */}
                  <div className="relative py-1 z-10 space-y-1">
                    {/* Centered Quotes Mark */}
                    <div className="text-3xl font-editorial text-pink-400 font-bold leading-none select-none">“</div>
                    
                    {/* Cursive heart loop vector behind quote */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none select-none">
                      <svg className="w-56 h-12 text-pink-500 fill-none stroke-current stroke-1" viewBox="0 0 200 50">
                        <path d="M10,25 C40,5 70,5 90,25 C110,40 130,40 150,25 C170,10 185,20 190,25" />
                      </svg>
                    </div>

                    <p className="font-editorial-body text-zinc-700 italic text-sm md:text-base leading-relaxed text-center relative z-10 max-w-sm mx-auto">
                      I love you in all iterations,<br />
                      in all conditions, forever.
                    </p>
                  </div>

                  {/* Replay capsule button */}
                  <div className="pt-2 relative z-10 flex flex-col items-center gap-4">
                    <button
                      onClick={() => {
                        setYesClicked(false);
                        setAct(1);
                        setTerminalPage(1);
                        setLogs([]);
                        setLogIndex(0);
                        setIsSearching(false);
                        setScanResultRevealed(false);
                        setCmdIndex(0);
                        setCmdLogs([
                          { cmd: "> whoami", res: "Mohit", typed: "", done: false },
                          { cmd: "> current_mission", res: "Make Yasha Smile", typed: "", done: false },
                          { cmd: "> relationship_status", res: "Madly In Love", typed: "", done: false },
                          { cmd: "> life_goal", res: "Spend Forever With Yasha", typed: "", done: false },
                        ]);
                        setShowAccessButton(false);
                        setNoHoverCount(0);
                        setNoBtnPos({ x: 0, y: 0 });
                      }}
                      className="px-8 py-3.5 bg-gradient-to-r from-[#ff527b] to-[#ff7b9f] hover:from-[#ff3866] hover:to-[#ff6690] text-white font-mono text-xs uppercase tracking-widest rounded-full shadow-[0_8px_20px_rgba(255,82,123,0.3)] hover:shadow-[0_12px_28px_rgba(255,82,123,0.45)] transition-all hover:scale-105 active:scale-95 duration-200 relative cursor-pointer font-bold animate-[pulse_3s_infinite]"
                    >
                      &gt;_ REPLAY THE CODE.EXE
                      <Sparkles className="absolute -top-1.5 -right-1.5 w-4 h-4 text-amber-300 animate-pulse" />
                    </button>

                    <div className="space-y-1">
                      <p className="font-sans text-[10px] md:text-xs font-semibold text-pink-500 uppercase tracking-widest select-none">
                        Because some loops are infinite.
                      </p>
                      <div className="flex justify-center select-none">
                        <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500 animate-[heartbeat_1s_infinite]" />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Bottom Left Corner: Logo N */}
                <div className="absolute bottom-6 left-6 z-10 select-none pointer-events-none">
                  {/* Circular Badge N */}
                  <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold font-sans text-sm shadow-md">
                    N
                  </div>
                </div>

              </div>
            )}
          </section>

          {/* Floating Secret Letter Envelope Button */}
          <button
            onClick={() => {
              setIsLetterOpen(true);
              if (!muted) synth.playAccessGrantedChime();
            }}
            className="fixed bottom-6 right-6 z-[100] w-12 h-12 rounded-full bg-white border-2 border-pink-300 text-pink-600 flex items-center justify-center shadow-[4px_4px_0px_#f43f5e] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#f43f5e] active:scale-95 transition-all cursor-pointer select-none"
            aria-label="Read secret letter"
          >
            <Mail className="w-5 h-5 animate-pulse" />
          </button>

          {/* Secret Cursive Love Letter Modal */}
          {isLetterOpen && (
            <div 
              className="fixed inset-0 bg-black/15 backdrop-blur-sm z-[20000] flex items-center justify-center p-4 animate-[fadeIn_0.3s_ease-out]"
              onClick={() => setIsLetterOpen(false)}
            >
              <div 
                className="bg-white/95 border border-pink-200/60 p-6 md:p-12 rounded-[1.5rem] md:rounded-[2.5rem] max-w-md w-full shadow-2xl relative text-center space-y-5 md:space-y-6 animate-[scaleUp_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)] select-text"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Envelope Seal Icon */}
                <div className="flex justify-center">
                  <div className="w-14 h-14 rounded-full bg-pink-50 flex items-center justify-center text-pink-500 shadow-inner">
                    <Heart className="w-6 h-6 fill-pink-500 animate-pulse" />
                  </div>
                </div>

                {/* Letter Body */}
                <div className="space-y-4 font-editorial-body text-zinc-700 italic text-base md:text-[17px] leading-relaxed">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-pink-500 not-italic font-bold">
                    [ letter_from_mohit.txt ]
                  </p>
                  <p className="font-semibold text-lg not-italic text-zinc-800 font-editorial">Dearest Yasha,</p>
                  <p>
                    From the moment you entered my world, everything changed. You brought color to my monochrome days and music to my silent thoughts.
                  </p>
                  <p>
                    This little page is my way of locking in this connection forever. Thank you for being my voice, my chaos, my smile, and my absolute everything.
                  </p>
                  <p className="pt-2 font-editorial not-italic text-zinc-800 text-lg">
                    Forever yours,<br />
                    <span className="font-semibold text-pink-500 italic font-editorial-body text-xl">Mohit ❤️</span>
                  </p>
                </div>

                {/* Close Button */}
                <div className="pt-2">
                  <button
                    onClick={() => setIsLetterOpen(false)}
                    className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-mono text-[10px] uppercase tracking-widest rounded-full cursor-pointer transition-all active:scale-95 shadow-md shadow-pink-100"
                  >
                    Close Letter
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Floating Cursor Hearts Trail */}
          {trailHearts.map((heart) => (
            <span
              key={heart.id}
              className={`absolute pointer-events-none text-pink-400/80 z-[9999] select-none ${
                heart.isBurst ? "animate-[burstHeart_1.2s_ease-out_forwards]" : "animate-[cursorHeart_1s_ease-out_forwards]"
              }`}
              style={{
                left: heart.x,
                top: heart.y,
                fontSize: `${heart.size}px`,
                transform: `translate(-50%, -50%) rotate(${heart.rotation}deg)`,
                ...(heart.isBurst
                  ? {
                      "--tx": heart.tx,
                      "--ty": heart.ty,
                      "--rot": `${heart.rotation * 1.5}deg`,
                    }
                  : {}),
              } as React.CSSProperties}
            >
              ❤️
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
