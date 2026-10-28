import React, { useState } from 'react';

export interface DonutSegment {
  label: string;
  count: number;
  color: string;
  percentage?: number;
}

interface DonutChartProps {
  data: DonutSegment[];
  title: string;
  subtitle?: string;
  centerLabel?: string;
  centerValue?: string | number;
  onSegmentClick?: (segment: DonutSegment) => void;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  title,
  subtitle,
  centerLabel = 'Total',
  centerValue,
  onSegmentClick,
}) => {
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  const total = data.reduce((acc, d) => acc + d.count, 0);
  const displayCenterValue = centerValue !== undefined ? centerValue : total;

  // SVG Geometry
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div className="p-5 rounded-2xl bg-[#151A18] border border-[#29312C] flex flex-col justify-between">
      <div>
        <div className="pb-3 border-b border-[#29312C]">
          <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">{title}</h3>
          {subtitle && <p className="text-xs text-[#A3ADA7] mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-4">
          {/* Donut SVG */}
          <div className="relative w-40 h-40 shrink-0">
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
              {/* Background ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#1B211E"
                strokeWidth={strokeWidth}
              />

              {/* Segments */}
              {data.map((seg) => {
                const percent = total > 0 ? seg.count / total : 0;
                const strokeDasharray = `${percent * circumference} ${circumference}`;
                const strokeDashoffset = -cumulativePercent * circumference;
                cumulativePercent += percent;

                const isSelected = activeSegment === seg.label;

                return (
                  <circle
                    key={seg.label}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={isSelected ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setActiveSegment(seg.label)}
                    onMouseLeave={() => setActiveSegment(null)}
                    onClick={() => onSegmentClick?.(seg)}
                  />
                );
              })}
            </svg>

            {/* Donut Center Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold font-['Outfit'] text-[#F5F7F6]">
                {displayCenterValue}
              </span>
              <span className="text-[10px] uppercase font-semibold text-[#A3ADA7]">
                {activeSegment || centerLabel}
              </span>
            </div>
          </div>

          {/* Interactive Legend List */}
          <div className="space-y-2 w-full text-xs">
            {data.map((seg) => {
              const pct = total > 0 ? Math.round((seg.count / total) * 100) : 0;
              const isSelected = activeSegment === seg.label;

              return (
                <div
                  key={seg.label}
                  onClick={() => {
                    setActiveSegment(isSelected ? null : seg.label);
                    onSegmentClick?.(seg);
                  }}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1B211E] border-[#32D6B0]/40'
                      : 'bg-[#101412] border-transparent hover:border-[#29312C]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="text-[#F5F7F6] truncate">{seg.label}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono shrink-0 ml-2">
                    <span className="font-bold text-[#F5F7F6]">{seg.count}</span>
                    <span className="text-[#A3ADA7] text-[11px]">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
