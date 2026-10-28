import React, { useState } from 'react';

export interface AssessmentPoint {
  id?: string;
  title: string;
  date?: string;
  score: number; // 0 - 100
  benchmark?: number; // e.g. 70 or 75
}

interface AssessmentTrendChartProps {
  data: AssessmentPoint[];
  title?: string;
  subtitle?: string;
  benchmark?: number;
}

export const AssessmentTrendChart: React.FC<AssessmentTrendChartProps> = ({
  data,
  title = 'Assessment Performance Over Time',
  subtitle = 'Progression across recent test evaluations and benchmarks',
  benchmark = 75,
}) => {
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
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#A3ADA7]">Target:</span>
              <span className="text-[#32D6B0] font-bold font-mono">{benchmark}%</span>
            </div>
          </div>
          <div className="h-48 flex flex-col items-center justify-center text-center p-4">
            <p className="text-xs font-semibold text-[#F5F7F6]">No Assessment Trajectory</p>
            <p className="text-[11px] text-[#A3ADA7] max-w-xs mt-1">
              Your test performance over time will appear here once you complete graded quizzes and exams.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const [hoveredPoint, setHoveredPoint] = useState<AssessmentPoint | null>(null);

  const width = 500;
  const height = 180;
  const padLeft = 40;
  const padRight = 30;
  const padTop = 20;
  const padBottom = 35;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const getX = (idx: number) => {
    if (data.length <= 1) return padLeft + chartW / 2;
    return padLeft + (idx / (data.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    return padTop + chartH - (val / 100) * chartH;
  };

  const points = data.map((d, i) => `${getX(i)},${getY(d.score)}`).join(' ');
  const areaPath = `${points} L ${getX(data.length - 1)},${padTop + chartH} L ${getX(0)},${padTop + chartH} Z`;

  const avgScore = Math.round(
    data.reduce((acc, d) => acc + d.score, 0) / Math.max(1, data.length)
  );

  return (
    <div className="p-5 rounded-2xl bg-[#151A18] border border-[#29312C] flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#29312C]">
          <div>
            <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">{title}</h3>
            <p className="text-xs text-[#A3ADA7] mt-0.5">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#A3ADA7]">Average Score:</span>
            <span className="font-bold text-[#32D6B0] text-sm">{avgScore}%</span>
          </div>
        </div>

        <div className="relative w-full overflow-hidden mt-4">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
            <defs>
              <linearGradient id="assessGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#78D98A" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#78D98A" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[0, 50, 75, 100].map((gridVal) => {
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
                    strokeDasharray={gridVal === benchmark ? '4 4' : '2 2'}
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    fill={gridVal === benchmark ? '#F2D64B' : '#A3ADA7'}
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {gridVal}%
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            <polygon fill="url(#assessGrad)" points={areaPath} />

            {/* Trajectory Line */}
            <polyline
              fill="none"
              stroke="#78D98A"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />

            {/* Data points */}
            {data.map((d, i) => {
              const x = getX(i);
              const y = getY(d.score);
              const isHovered = hoveredPoint?.title === d.title;

              return (
                <g key={d.title || i}>
                  <rect
                    x={x - 20}
                    y={padTop}
                    width={40}
                    height={chartH}
                    fill="transparent"
                    onMouseEnter={() => setHoveredPoint(d)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="cursor-pointer"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 6 : 4}
                    fill="#0A0D0C"
                    stroke={d.score >= benchmark ? '#32D6B0' : '#FF7272'}
                    strokeWidth={isHovered ? 3 : 2}
                  />
                  {/* Point score label */}
                  <text
                    x={x}
                    y={y - 8}
                    textAnchor="middle"
                    fill={d.score >= benchmark ? '#32D6B0' : '#FF7272'}
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {d.score}%
                  </text>
                  {/* Title / Attempt label */}
                  <text
                    x={x}
                    y={height - 10}
                    textAnchor="middle"
                    fill="#A3ADA7"
                    fontSize="10"
                  >
                    {d.title.length > 12 ? `${d.title.substring(0, 10)}…` : d.title}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Tooltip */}
          {hoveredPoint && (
            <div className="absolute top-0 right-2 p-2 bg-[#1B211E] border border-[#78D98A]/40 rounded-xl shadow-lg text-xs pointer-events-none">
              <p className="font-bold text-[#F5F7F6]">{hoveredPoint.title}</p>
              <p className="text-[#32D6B0] font-mono">Score: {hoveredPoint.score}%</p>
              {hoveredPoint.date && <p className="text-[10px] text-[#A3ADA7]">{hoveredPoint.date}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
