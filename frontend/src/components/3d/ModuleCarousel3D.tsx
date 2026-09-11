import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  FolderLock,
  CheckCircle2,
  GraduationCap,
  Languages,
  Plane,
  Home,
  Share2,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Cpu,
  HeartPulse,
  Coins,
} from 'lucide-react';
import { useJourney } from '../../context/JourneyContext.js';

interface ModuleItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  path: string;
  icon: any;
  color: string;
  metricLabel: string;
  getMetricValue: (journey: any, docs: any[], readiness: any) => string;
}

export const ModuleCarousel3D: React.FC = () => {
  const { activeJourney, documents, readiness } = useJourney();
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const navigate = useNavigate();

  const progressRef = useRef<number>(0);
  const targetProgressRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const isHoveredRef = useRef<boolean>(false);

  const modules: ModuleItem[] = [
    {
      id: 'mobility-twin',
      title: 'Mobility Twin',
      subtitle: 'Live Trajectory & Simulator',
      category: 'SYNTHESIS',
      path: '/mobility-twin',
      icon: Cpu,
      color: 'from-cyan-600/30 to-blue-900/30',
      metricLabel: 'TWIN STATUS',
      getMetricValue: (_j, _d, r) => `${r ? r.overallScore : 0}% Dynamic`,
    },
    {
      id: 'health-vault',
      title: 'Health Vault',
      subtitle: 'Vaccinations & Insurance',
      category: 'HEALTH',
      path: '/health-vault',
      icon: HeartPulse,
      color: 'from-rose-600/30 to-red-900/30',
      metricLabel: 'PRIVACY',
      getMetricValue: () => 'Private by Default',
    },
    {
      id: 'cost-planner',
      title: 'Cost Planner',
      subtitle: 'Multi-Currency Budgeting',
      category: 'FINANCE',
      path: '/cost-planner',
      icon: Coins,
      color: 'from-amber-600/30 to-yellow-900/30',
      metricLabel: 'SOLVENCY',
      getMetricValue: (_j, _d, r) => `${r?.categories?.financial || 60}% Funded`,
    },
    {
      id: 'journey-stages',
      title: 'Journey Stages',
      subtitle: '12-Stage Cross-Border Roadmap',
      category: 'ROADMAP',
      path: '/journey/stages',
      icon: Compass,
      color: 'from-blue-600/30 to-indigo-900/30',
      metricLabel: 'ACTIVE STAGE',
      getMetricValue: (j) => (j ? `Stage ${j.current_stage_number}: ${j.current_stage_name}` : 'Not Started'),
    },
    {
      id: 'vault',
      title: 'Document Vault',
      subtitle: 'Cryptographic SHA-256 Storage',
      category: 'VAULT',
      path: '/vault',
      icon: FolderLock,
      color: 'from-emerald-600/30 to-teal-900/30',
      metricLabel: 'STORED FILES',
      getMetricValue: (_j, docs) => `${docs.length} Documents`,
    },
    {
      id: 'readiness',
      title: 'Readiness Engine',
      subtitle: 'Deterministic Mathematical Score',
      category: 'ANALYTICS',
      path: '/journey/stages',
      icon: CheckCircle2,
      color: 'from-amber-600/30 to-orange-900/30',
      metricLabel: 'READINESS',
      getMetricValue: (_j, _d, r) => `${r ? r.overallScore : 0}% READY`,
    },
    {
      id: 'scholarships',
      title: 'Opportunities',
      subtitle: 'Curated Grants & Fellowships',
      category: 'FUNDING',
      path: '/scholarships',
      icon: GraduationCap,
      color: 'from-purple-600/30 to-violet-900/30',
      metricLabel: 'DATABASE',
      getMetricValue: () => 'Global Grants Active',
    },
    {
      id: 'translator',
      title: 'AI Translator',
      subtitle: 'Text, Speech, Camera OCR',
      category: 'LANGUAGE',
      path: '/translator',
      icon: Languages,
      color: 'from-rose-600/30 to-pink-900/30',
      metricLabel: 'MODES',
      getMetricValue: () => '4 Cross-Border Modes',
    },
    {
      id: 'travel-prep',
      title: 'Travel Preparation',
      subtitle: 'Pre-departure & Logistics Protocol',
      category: 'TRAVEL',
      path: '/travel-prep',
      icon: Plane,
      color: 'from-cyan-600/30 to-blue-900/30',
      metricLabel: 'CHECKLIST',
      getMetricValue: () => 'Customs & Health Ready',
    },
    {
      id: 'arrival',
      title: 'Arrival Mode',
      subtitle: 'Post-Landing & Registration Guidance',
      category: 'ARRIVAL',
      path: '/arrival',
      icon: Home,
      color: 'from-emerald-600/30 to-green-900/30',
      metricLabel: 'MUNICIPAL',
      getMetricValue: () => 'Anmeldung & SIM Guide',
    },
    {
      id: 'share',
      title: 'Selective Share',
      subtitle: 'Time-Limited Disclosures & QR',
      category: 'SECURITY',
      path: '/share',
      icon: Share2,
      color: 'from-fuchsia-600/30 to-purple-900/30',
      metricLabel: 'DISCLOSURE',
      getMetricValue: () => 'Token-Protected',
    },
    {
      id: 'emergency',
      title: 'Emergency Profile',
      subtitle: 'Instant Medical & Consular Card',
      category: 'ASSISTANCE',
      path: '/emergency',
      icon: AlertTriangle,
      color: 'from-red-600/30 to-rose-900/30',
      metricLabel: 'EMERGENCY QR',
      getMetricValue: () => 'Temporary Access',
    },
  ];

  const count = modules.length;

  const updateMotion = useCallback(() => {
    if (!isDraggingRef.current && !isHoveredRef.current) {
      targetProgressRef.current += 0.0012;
    }

    progressRef.current += (targetProgressRef.current - progressRef.current) * 0.08;

    const cards = containerRef.current?.querySelectorAll<HTMLDivElement>('.module-card');
    if (cards) {
      const radius = window.innerWidth < 768 ? 360 : 500;

      cards.forEach((card, index) => {
        const theta = ((index / count) + progressRef.current) * 2 * Math.PI;
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);

        const x = sinTheta * radius;
        const z = cosTheta * radius - radius * 0.5;
        const rotY = (theta * 180) / Math.PI;

        const depthFactor = (cosTheta + 1) / 2;
        const opacity = Math.max(0.15, Math.pow(depthFactor, 1.3));
        const scale = 0.85 + depthFactor * 0.22;

        card.style.transform = `translate3d(${x}px, 0px, ${z}px) rotateY(${rotY}deg) scale(${scale})`;
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

  const shift = (direction: 'left' | 'right') => {
    targetProgressRef.current += direction === 'left' ? 1 / count : -1 / count;
  };

  return (
    <div
      className="relative w-full py-12 overflow-hidden select-none"
      onMouseEnter={() => (isHoveredRef.current = true)}
      onMouseLeave={() => {
        isHoveredRef.current = false;
        handleMouseUp();
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMoveGlobal}
      onMouseUp={handleMouseUp}
    >
      <div
        ref={containerRef}
        className="relative h-[380px] w-full flex items-center justify-center perspective-1350 transform-style-3d cursor-grab active:cursor-grabbing"
      >
        {modules.map((m) => {
          const Icon = m.icon;
          const metric = m.getMetricValue(activeJourney, documents, readiness);
          return (
            <div
              key={m.id}
              onClick={() => navigate(m.path)}
              className="module-card absolute w-[260px] sm:w-[300px] h-[340px] rounded-3xl overflow-hidden glass-strong border border-white/20 p-6 flex flex-col justify-between shadow-2xl transition-all duration-300 hover:border-white/40 cursor-pointer"
            >
              {/* Card Ambient Glow */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${m.color} opacity-40 rounded-3xl pointer-events-none`}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono tracking-widest text-white/50 uppercase">
                    {m.category}
                  </span>
                  <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center border border-white/15">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-xl font-bold tracking-tight text-white">{m.title}</h4>
                  <p className="text-xs text-white/60 mt-1">{m.subtitle}</p>
                </div>
              </div>

              <div className="relative z-10 pt-4 border-t border-white/10">
                <div className="text-[10px] font-mono text-white/40 uppercase mb-1">
                  {m.metricLabel}
                </div>
                <div className="text-sm font-semibold text-white tracking-wide truncate">
                  {metric}
                </div>

                <div className="mt-4 flex items-center justify-between text-xs font-medium text-white/80 group-hover:text-white">
                  <span>Open Module</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Steppers */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <button
          onClick={() => shift('left')}
          className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-mono text-white/40 uppercase tracking-wider">
          MidBridge 2.0 Spatial Hub
        </span>
        <button
          onClick={() => shift('right')}
          className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
