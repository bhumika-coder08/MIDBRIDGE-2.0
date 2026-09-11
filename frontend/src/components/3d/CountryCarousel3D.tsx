import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Clock, Globe, Shield, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Country } from '../../types/index.js';

interface CountryCarousel3DProps {
  countries: Country[];
}

export const CountryCarousel3D: React.FC<CountryCarousel3DProps> = ({ countries }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const navigate = useNavigate();

  // Active interaction refs
  const progressRef = useRef<number>(0);
  const targetProgressRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const isHoveredRef = useRef<boolean>(false);

  // Mouse tilt tracking
  const mousePos = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  // Track flipped cards: set of country codes
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  // Display subset of top 8-12 countries for optimal circular 3D aesthetics
  const displayCountries = countries.slice(0, 10);
  const count = displayCountries.length;

  const toggleFlip = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFlippedCards(prev => ({ ...prev, [code]: !prev[code] }));
  };

  // 60fps Render Loop using requestAnimationFrame
  const updateMotion = useCallback(() => {
    // Autoplay progression when not dragging or hovering
    if (!isDraggingRef.current && !isHoveredRef.current) {
      targetProgressRef.current += 0.0015;
    }

    // Inertia interpolation (Part 54: current += (target - current) * 0.08)
    progressRef.current += (targetProgressRef.current - progressRef.current) * 0.08;

    // Mouse tilt damping
    mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.08;
    mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.08;

    const cards = containerRef.current?.querySelectorAll<HTMLDivElement>('.carousel-card');
    if (cards) {
      const radius = window.innerWidth < 768 ? 380 : 540; // Cylindrical radius
      const tiltX = -mousePos.current.y * 12;
      const tiltY = mousePos.current.x * 12;

      cards.forEach((card, index) => {
        // Compute circular angle for cylinder
        const theta = ((index / count) + progressRef.current) * 2 * Math.PI;
        const normalizedAngle = (theta % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);

        // Position on 3D cylinder
        const x = sinTheta * radius;
        const z = cosTheta * radius - radius * 0.5; // push back slightly into perspective
        const rotY = (theta * 180) / Math.PI;

        // Depth and scale decay
        const depthFactor = (cosTheta + 1) / 2; // 0 (back) to 1 (front center)
        const opacity = Math.max(0.2, Math.pow(depthFactor, 1.2));
        const scale = 0.85 + depthFactor * 0.25;

        card.style.transform = `translate3d(${x}px, 0px, ${z}px) rotateY(${rotY}deg) rotateX(${tiltX * 0.2}deg) scale(${scale})`;
        card.style.opacity = `${opacity}`;
        card.style.zIndex = `${Math.round(depthFactor * 100)}`;
        card.style.pointerEvents = depthFactor > 0.4 ? 'auto' : 'none';
      });
    }

    animFrameRef.current = requestAnimationFrame(updateMotion);
  }, [count]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(updateMotion);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [updateMotion]);

  // Mouse tilt handlers
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mousePos.current.targetX = x;
    mousePos.current.targetY = y;
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
  };

  const handleMouseMoveGlobal = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - startXRef.current;
    targetProgressRef.current += deltaX * 0.0008;
    startXRef.current = e.clientX;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Wheel navigation
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    targetProgressRef.current += e.deltaY * 0.0003;
  };

  const shiftCarousel = (direction: 'left' | 'right') => {
    targetProgressRef.current += direction === 'left' ? 1 / count : -1 / count;
  };

  if (displayCountries.length === 0) return null;

  return (
    <div
      className="relative w-full py-16 overflow-hidden select-none"
      onMouseEnter={() => (isHoveredRef.current = true)}
      onMouseLeave={() => {
        isHoveredRef.current = false;
        mousePos.current.targetX = 0;
        mousePos.current.targetY = 0;
        handleMouseUp();
      }}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Perspective Container (1350px) */}
      <div
        ref={containerRef}
        className="relative h-[480px] w-full flex items-center justify-center perspective-1350 transform-style-3d cursor-grab active:cursor-grabbing"
      >
        {displayCountries.map((c) => {
          const isFlipped = !!flippedCards[c.code];
          return (
            <div
              key={c.code}
              className="carousel-card absolute w-[290px] sm:w-[330px] h-[440px] rounded-3xl transition-opacity duration-300 will-change-transform"
              style={{
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Inner flippable container */}
              <div
                className={`relative w-full h-full duration-500 rounded-3xl transition-transform transform-style-3d ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
                style={{
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* FRONT FACE (Part 10) */}
                <div className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden glass-strong border border-white/20 shadow-2xl flex flex-col justify-between p-6 backface-hidden">
                  {/* Background scenic photo with glass gradient overlay */}
                  <div className="absolute inset-0 z-0">
                    <img
                      src={c.cover_image}
                      alt={c.name}
                      className="w-full h-full object-cover opacity-35 transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
                  </div>

                  {/* Top Bar: Flag, Code & Region */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl filter drop-shadow-md">{c.flag_emoji}</span>
                      <div>
                        <h3 className="text-xl font-bold tracking-tight text-white">{c.name}</h3>
                        <p className="text-[11px] font-mono text-white/60 uppercase">{c.region}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono border border-white/15 text-white/80">
                      {c.code}
                    </span>
                  </div>

                  {/* Middle Information: Purpose Badges */}
                  <div className="relative z-10 space-y-3">
                    <p className="text-xs text-white/70 line-clamp-3 leading-relaxed">
                      {c.summary}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {c.popular_purposes.slice(0, 3).map((p) => (
                        <span
                          key={p}
                          className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-medium text-white/80 border border-white/10"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Face Controls */}
                  <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-white/60">
                      <Clock className="h-3.5 w-3.5 text-emerald-400" />
                      <span>~{c.processing_time_weeks}w consular</span>
                    </div>

                    <button
                      onClick={(e) => toggleFlip(c.code, e)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium text-white border border-white/15 transition-colors"
                      title="Flip to view visa & mobility criteria"
                    >
                      <span>Details</span>
                      <RotateCcw className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* BACK FACE (Part 10) */}
                <div
                  className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden bg-[#0c0c10] border border-white/25 shadow-2xl flex flex-col justify-between p-6 backface-hidden"
                  style={{
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{c.flag_emoji}</span>
                        <div className="text-sm font-bold text-white">{c.name} Intelligence</div>
                      </div>
                      <button
                        onClick={(e) => toggleFlip(c.code, e)}
                        className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2 text-xs text-white/80">
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-white/50">Primary Currency:</span>
                        <span className="font-mono text-white">{c.currency || 'National Currency'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-white/50">Language Requirement:</span>
                        <span className="text-white">{c.language || 'Official Language'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-white/50">Average Processing:</span>
                        <span className="text-emerald-400 font-mono">{c.processing_time_weeks} Weeks</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-white/50">Active Scholarships:</span>
                        <span className="text-blue-400 font-mono">Curated Database</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-white/60 leading-relaxed italic">
                      MidBridge 2.0 builds standardized checklists for identity, academic evaluation, blocked accounts, and municipal registration.
                    </p>
                  </div>

                  <div className="space-y-2 pt-4">
                    <button
                      onClick={() => navigate(`/countries/${c.code}`)}
                      className="w-full py-2 rounded-full text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      <span>Explore Country Intelligence</span>
                    </button>
                    <button
                      onClick={() => navigate('/journey/builder')}
                      className="w-full py-2 rounded-full text-xs font-semibold text-white btn-primary transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Start Journey to {c.name}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Left/Right Carousel Controls */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={() => shiftCarousel('left')}
          className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          title="Previous destination"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-mono text-white/50 uppercase tracking-widest">
          Rotate / Drag to Explore
        </span>
        <button
          onClick={() => shiftCarousel('right')}
          className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          title="Next destination"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
