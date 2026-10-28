import React, { useState } from 'react';
import { Target, Award, Info } from 'lucide-react';

interface ReadinessGaugeProps {
  score: number; // 0 - 100
  initialTarget?: number; // default 75
  title?: string;
  subtitle?: string;
  onTargetChange?: (newTarget: number) => void;
}

export const ReadinessGauge: React.FC<ReadinessGaugeProps> = ({
  score,
  initialTarget = 75,
  title = 'Readiness Score vs Job-Ready Target',
  subtitle = 'Industry benchmark for internship and junior engineering placement',
}) => {
  const [target, setTarget] = useState<number>(initialTarget);
  const [showConfig, setShowConfig] = useState(false);

  const normalizedScore = Math.max(0, Math.min(100, score));
  const normalizedTarget = Math.max(0, Math.min(100, target));

  // Gauge geometry: Semi-circle
  const radius = 80;
  const strokeWidth = 14;
  const center = 100;
  const circumference = Math.PI * radius; // Half-circle perimeter
  const progressOffset = circumference - (normalizedScore / 100) * circumference;

  // Determine status color and copy
  const isReady = normalizedScore >= normalizedTarget;
  const delta = normalizedScore - normalizedTarget;

  const getStatus = () => {
    if (normalizedScore >= 80) return { label: 'Job Ready', color: '#32D6B0', textClass: 'text-[#32D6B0]' };
    if (normalizedScore >= 60) return { label: 'Approaching Target', color: '#F2D64B', textClass: 'text-[#F2D64B]' };
    return { label: 'Needs Practice', color: '#FF7272', textClass: 'text-[#FF7272]' };
  };

  const status = getStatus();

  // Target indicator angle on the semi-circle (from -180 deg to 0 deg)
  const targetAngle = Math.PI * (1 - normalizedTarget / 100);
  const targetX = center + radius * Math.cos(targetAngle);
  const targetY = center - radius * Math.sin(targetAngle);

  return (
    <div className="p-5 rounded-2xl bg-[#151A18] border border-[#29312C] flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">{title}</h3>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="text-[#A3ADA7] hover:text-[#32D6B0] text-[11px] font-medium transition-colors cursor-pointer"
              title="Configure target"
            >
              [Edit Target]
            </button>
          </div>
          <p className="text-xs text-[#A3ADA7] mt-0.5">{subtitle}</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-[#101F1B] text-[#32D6B0] flex items-center justify-center shrink-0">
          <Award className="w-4 h-4" />
        </div>
      </div>

      {showConfig && (
        <div className="mt-3 p-3 bg-[#0A0D0C] rounded-xl border border-[#29312C] text-xs space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[#A3ADA7]">
            <span>Benchmark Goal:</span>
            <span className="font-bold text-[#F5F7F6]">{target} pts</span>
          </div>
          <input
            type="range"
            min={50}
            max={95}
            step={5}
            value={target}
            onChange={(e) => {
              const val = Number(e.target.value);
              setTarget(val);
            }}
            className="w-full accent-[#32D6B0] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#A3ADA7]">
            <span>Junior (65)</span>
            <span>Mid (75)</span>
            <span>Competitive (85)</span>
          </div>
        </div>
      )}

      {/* SVG Semi-Circle Gauge */}
      <div className="relative flex flex-col items-center justify-center my-4">
        <svg viewBox="0 0 200 120" className="w-48 sm:w-56 overflow-visible">
          <defs>
            <linearGradient id="readinessGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#32D6B0" />
              <stop offset="60%" stopColor="#78D98A" />
              <stop offset="100%" stopColor="#F2D64B" />
            </linearGradient>
          </defs>

          {/* Background Track Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#1B211E"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Foreground Value Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#readinessGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />

          {/* Target marker flag/pin */}
          <circle
            cx={targetX}
            cy={targetY}
            r={5}
            fill="#0A0D0C"
            stroke="#F2D64B"
            strokeWidth={3}
          />
        </svg>

        {/* Center score readout */}
        <div className="absolute top-[52px] flex flex-col items-center text-center">
          <span className="text-3xl sm:text-4xl font-extrabold font-['Outfit'] text-[#F5F7F6] tracking-tight">
            {normalizedScore}
          </span>
          <span className="text-[11px] font-semibold text-[#A3ADA7] tracking-wider uppercase">
            Score / 100
          </span>
        </div>
      </div>

      {/* Bottom KPI metadata footer */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#29312C] text-center text-xs">
        <div className="p-2 rounded-lg bg-[#0A0D0C]/80 border border-[#29312C]/60">
          <span className="text-[11px] text-[#A3ADA7] block">Status</span>
          <span className={`font-bold ${status.textClass}`}>{status.label}</span>
        </div>
        <div className="p-2 rounded-lg bg-[#0A0D0C]/80 border border-[#29312C]/60">
          <span className="text-[11px] text-[#A3ADA7] block">Target</span>
          <span className="font-bold text-[#F5F7F6]">{normalizedTarget} pts</span>
        </div>
        <div className="p-2 rounded-lg bg-[#0A0D0C]/80 border border-[#29312C]/60">
          <span className="text-[11px] text-[#A3ADA7] block">Gap</span>
          <span className={`font-bold ${delta >= 0 ? 'text-[#32D6B0]' : 'text-[#FF7272]'}`}>
            {delta >= 0 ? `+${delta} pts` : `${delta} pts`}
          </span>
        </div>
      </div>
    </div>
  );
};
