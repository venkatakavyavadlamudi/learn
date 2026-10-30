import React, { useState } from 'react';
import { Clock, TrendingUp } from 'lucide-react';

export interface StudyDayData {
  day: string;
  hours: number;
  targetHours: number;
}

interface WeeklyStudyLineChartProps {
  data: StudyDayData[];
  title?: string;
  subtitle?: string;
  weeklyTargetTotal?: number;
}

export const WeeklyStudyLineChart: React.FC<WeeklyStudyLineChartProps> = ({
  data,
  title = 'Weekly Study Hours vs Target',
  subtitle = 'Actual daily study commitment compared to target learning goal',
  weeklyTargetTotal = 24,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const safeData = data || [];

  if (safeData.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-[#151A18] border border-[#29312C] flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#29312C]">
            <div>
              <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">{title}</h3>
              <p className="text-xs text-[#A3ADA7] mt-0.5">{subtitle}</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[#A3ADA7] block">This Week</span>
              <span className="text-sm font-bold text-[#32D6B0]">0.0 hrs</span>
            </div>
          </div>
          <div className="h-48 flex flex-col items-center justify-center text-center p-4">
            <div className="w-10 h-10 rounded-xl bg-[#101412] border border-[#29312C] flex items-center justify-center text-[#F2D64B] mb-2">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-[#F5F7F6]">No Study Sessions Recorded</p>
            <p className="text-[11px] text-[#A3ADA7] max-w-xs mt-1">
              Begin coursework or coding sessions to start tracking your daily study hours against your target.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalHours = Number(safeData.reduce((acc, d) => acc + d.hours, 0).toFixed(1));
  const avgDailyHours = Number((totalHours / Math.max(1, safeData.length)).toFixed(1));
  const maxHours = Math.max(8, ...safeData.map((d) => Math.max(d.hours, d.targetHours))) + 1;

  // SVG Chart geometry
  const width = 500;
  const height = 180;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const getX = (index: number) => {
    if (safeData.length <= 1) return padLeft + chartW / 2;
    return padLeft + (index / (safeData.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    return padTop + chartH - (val / maxHours) * chartH;
  };

  // Generate path string for actual hours
  const points = safeData.map((d, i) => `${getX(i)},${getY(d.hours)}`).join(' ');
  const areaPath = `${points} L ${getX(safeData.length - 1)},${padTop + chartH} L ${getX(0)},${padTop + chartH} Z`;

  // Target line path
  const targetPoints = safeData.map((d, i) => `${getX(i)},${getY(d.targetHours)}`).join(' ');

  return (
    <div className="p-5 rounded-2xl bg-[#151A18] border border-[#29312C] flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#29312C]">
          <div>
            <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">{title}</h3>
            <p className="text-xs text-[#A3ADA7] mt-0.5">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="text-right">
              <span className="text-[11px] text-[#A3ADA7] block">This Week</span>
              <span className="text-sm font-bold text-[#32D6B0]">{totalHours} hrs</span>
            </div>
            <div className="text-right pl-3 border-l border-[#29312C]">
              <span className="text-[11px] text-[#A3ADA7] block">Goal</span>
              <span className="text-sm font-bold text-[#F2D64B]">{weeklyTargetTotal} hrs</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 mb-1 text-[11px] text-[#A3ADA7]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#32D6B0]" />
            <span>Actual Study Hours</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#F2D64B] border-t border-dashed border-[#F2D64B]" />
            <span>Target Goal ({safeData[0]?.targetHours || 3}h/day)</span>
          </div>
        </div>

        {/* SVG Responsive Line Chart */}
        <div className="relative w-full overflow-hidden mt-2">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
            <defs>
              <linearGradient id="studyAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#32D6B0" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#32D6B0" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid horizontal guidelines */}
            {[0, 2, 4, 6, 8].map((gridVal) => {
              if (gridVal > maxHours) return null;
              const y = getY(gridVal);
              return (
                <g key={gridVal}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={width - padRight}
                    y2={y}
                    stroke="#29312C"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    fill="#A3ADA7"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {gridVal}h
                  </text>
                </g>
              );
            })}

            {/* Target Line (Dashed) */}
            <polyline
              fill="none"
              stroke="#F2D64B"
              strokeWidth="2"
              strokeDasharray="4 4"
              points={targetPoints}
            />

            {/* Area Fill */}
            <polygon fill="url(#studyAreaGrad)" points={areaPath} />

            {/* Actual Study Line */}
            <polyline
              fill="none"
              stroke="#32D6B0"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />

            {/* Interactive Data Points */}
            {safeData.map((d, i) => {
              const x = getX(i);
              const y = getY(d.hours);
              const isHovered = hoverIndex === i;

              return (
                <g key={`${d.day || 'day'}-${i}`}>
                  {/* Invisible touch target */}
                  <rect
                    x={x - 20}
                    y={padTop}
                    width={40}
                    height={chartH}
                    fill="transparent"
                    onMouseEnter={() => setHoverIndex(i)}
                    onMouseLeave={() => setHoverIndex(null)}
                    className="cursor-pointer"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 6 : 4}
                    fill="#0A0D0C"
                    stroke="#32D6B0"
                    strokeWidth={isHovered ? 3 : 2}
                    className="transition-all"
                  />
                  {/* Day label */}
                  <text
                    x={x}
                    y={height - 8}
                    textAnchor="middle"
                    fill={isHovered ? '#32D6B0' : '#A3ADA7'}
                    fontSize="11"
                    fontWeight={isHovered ? 'bold' : 'normal'}
                  >
                    {d.day}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Hover Tooltip */}
          {hoverIndex !== null && data[hoverIndex] && (
            <div
              className="absolute pointer-events-none p-2 bg-[#1B211E] border border-[#32D6B0]/40 rounded-xl shadow-xl text-xs z-10 transition-all"
              style={{
                left: `${(getX(hoverIndex) / width) * 100}%`,
                top: '10px',
                transform: 'translateX(-50%)',
              }}
            >
              <div className="font-bold text-[#F5F7F6]">{data[hoverIndex].day}</div>
              <div className="text-[#32D6B0] font-semibold">{data[hoverIndex].hours} hrs studied</div>
              <div className="text-[10px] text-[#A3ADA7]">
                Target: {data[hoverIndex].targetHours} hrs ({data[hoverIndex].hours >= data[hoverIndex].targetHours ? '✓ Target Met' : `${(data[hoverIndex].targetHours - data[hoverIndex].hours).toFixed(1)}h deficit`})
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 mt-2 border-t border-[#29312C] flex items-center justify-between text-xs text-[#A3ADA7]">
        <span>Daily Average: <strong className="text-[#F5F7F6]">{avgDailyHours} hrs / day</strong></span>
        <span className="text-[#32D6B0] font-semibold">
          {totalHours >= weeklyTargetTotal ? 'Weekly Goal Exceeded!' : `${(weeklyTargetTotal - totalHours).toFixed(1)} hrs to target`}
        </span>
      </div>
    </div>
  );
};
