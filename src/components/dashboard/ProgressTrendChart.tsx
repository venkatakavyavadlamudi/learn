import React, { useState } from 'react';

interface ProgressTrendData {
  week: string;
  avgProgress: number;
  atRiskProgress: number;
}

interface ProgressTrendChartProps {
  data: ProgressTrendData[];
  title?: string;
  subtitle?: string;
}

export const ProgressTrendChart: React.FC<ProgressTrendChartProps> = ({
  data,
  title = 'Student Progress Trajectory (Cohort vs At-Risk)',
  subtitle = 'Track completion velocity to intervene before students fall behind',
}) => {
  const [activePoint, setActivePoint] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-[#151A18] border border-[#29312C] flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#29312C]">
            <div>
              <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">{title}</h3>
              {subtitle && <p className="text-xs text-[#A3ADA7] mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <div className="h-44 flex items-center justify-center text-xs text-[#A3ADA7]">
            Loading progress trends...
          </div>
        </div>
      </div>
    );
  }

  // SVG dimensions
  const width = 500;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Calculate coordinates
  const stepX = chartWidth / Math.max(1, data.length - 1);
  const maxVal = 100;

  const pointsAvg = data.map((d, i) => ({
    x: paddingX + i * stepX,
    y: paddingY + chartHeight - (d.avgProgress / maxVal) * chartHeight,
    data: d,
  }));

  const pointsAtRisk = data.map((d, i) => ({
    x: paddingX + i * stepX,
    y: paddingY + chartHeight - (d.atRiskProgress / maxVal) * chartHeight,
    data: d,
  }));

  const avgPath = pointsAvg.reduce(
    (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`,
    ''
  );

  const atRiskPath = pointsAtRisk.reduce(
    (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`,
    ''
  );

  return (
    <div className="p-5 rounded-2xl bg-[#151A18] border border-[#29312C] flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#29312C]">
          <div>
            <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">{title}</h3>
            {subtitle && <p className="text-xs text-[#A3ADA7] mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 bg-[#32D6B0] rounded-full" />
              <span className="text-[#A3ADA7]">Cohort Average</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 bg-[#FF7272] rounded-full" />
              <span className="text-[#A3ADA7]">At-Risk Students</span>
            </div>
          </div>
        </div>

        <div className="mt-4 relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
            {/* Grid horizontal guidelines */}
            {[0, 25, 50, 75, 100].map((v) => {
              const y = paddingY + chartHeight - (v / maxVal) * chartHeight;
              return (
                <g key={v}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="#29312C"
                    strokeDasharray="2,4"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    textAnchor="end"
                    fill="#A3ADA7"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {v}%
                  </text>
                </g>
              );
            })}

            {/* At-Risk Path */}
            <path
              d={atRiskPath}
              fill="none"
              stroke="#FF7272"
              strokeWidth="2.5"
              strokeDasharray="4,4"
            />

            {/* Cohort Avg Path */}
            <path
              d={avgPath}
              fill="none"
              stroke="#32D6B0"
              strokeWidth="3"
            />

            {/* At-Risk Dots */}
            {pointsAtRisk.map((pt, i) => (
              <circle
                key={`risk-${i}`}
                cx={pt.x}
                cy={pt.y}
                r="4"
                fill="#FF7272"
                stroke="#151A18"
                strokeWidth="2"
              />
            ))}

            {/* Avg Dots */}
            {pointsAvg.map((pt, i) => (
              <circle
                key={`avg-${i}`}
                cx={pt.x}
                cy={pt.y}
                r={activePoint === i ? '6' : '4.5'}
                fill="#32D6B0"
                stroke="#151A18"
                strokeWidth="2"
                className="cursor-pointer transition-all"
                onMouseEnter={() => setActivePoint(i)}
                onMouseLeave={() => setActivePoint(null)}
              />
            ))}

            {/* X-axis labels */}
            {pointsAvg.map((pt, i) => (
              <text
                key={`lbl-${i}`}
                x={pt.x}
                y={height - 4}
                textAnchor="middle"
                fill="#A3ADA7"
                fontSize="10"
                fontWeight="500"
              >
                {pt.data.week}
              </text>
            ))}
          </svg>

          {/* Active tooltip */}
          {activePoint !== null && (
            <div className="mt-2 p-2 bg-[#1B211E] border border-[#29312C] rounded-lg text-xs flex items-center justify-between">
              <span className="font-semibold text-[#F5F7F6]">{data[activePoint].week} Trajectory</span>
              <div className="flex items-center gap-3">
                <span className="text-[#32D6B0]">Cohort: {data[activePoint].avgProgress}%</span>
                <span className="text-[#FF7272]">At-Risk: {data[activePoint].atRiskProgress}%</span>
                <span className="text-[#F2D64B] font-mono">
                  Gap: -{data[activePoint].avgProgress - data[activePoint].atRiskProgress}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
