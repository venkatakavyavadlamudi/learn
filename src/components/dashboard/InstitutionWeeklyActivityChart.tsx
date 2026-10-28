import React, { useState } from 'react';
import { TrendingUp, Clock, Users } from 'lucide-react';

interface WeeklyActivityPoint {
  week: string;
  totalHours: number;
  activeLogins: number;
}

interface InstitutionWeeklyActivityChartProps {
  data: WeeklyActivityPoint[];
  title?: string;
  subtitle?: string;
}

export const InstitutionWeeklyActivityChart: React.FC<InstitutionWeeklyActivityChartProps> = ({
  data,
  title = 'Weekly Learning Activity & Engagement Velocity',
  subtitle = 'Total active student learning hours and unique daily active logins',
}) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

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
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#32D6B0] animate-pulse" />
              <span>Loading engagement activity metrics...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const width = 500;
  const height = 180;
  const paddingX = 45;
  const paddingY = 25;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const maxHours = Math.max(...data.map((d) => d.totalHours), 750);
  const stepX = chartW / Math.max(1, data.length - 1);

  const points = data.map((d, i) => ({
    x: paddingX + i * stepX,
    y: paddingY + chartH - (d.totalHours / maxHours) * chartH,
    data: d,
  }));

  const pathStr = points.reduce(
    (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`,
    ''
  );

  const areaStr =
    points.length > 0
      ? `${pathStr} L ${points[points.length - 1].x} ${paddingY + chartH} L ${points[0].x} ${paddingY + chartH} Z`
      : '';

  const latestData = data[data.length - 1];

  return (
    <div className="p-5 rounded-2xl bg-[#151A18] border border-[#29312C] flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#29312C]">
          <div>
            <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">{title}</h3>
            {subtitle && <p className="text-xs text-[#A3ADA7] mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 bg-[#32D6B0] rounded-full" />
              <span className="text-[#A3ADA7]">Learning Hours</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 bg-[#F2D64B] rounded-full" />
              <span className="text-[#A3ADA7]">Active Logins</span>
            </div>
          </div>
        </div>

        <div className="mt-4 relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
            <defs>
              <linearGradient id="adminActivityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#32D6B0" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#32D6B0" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal guidelines */}
            {[0, 200, 400, 600].map((v) => {
              const y = paddingY + chartH - (v / maxHours) * chartH;
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
                    {v}h
                  </text>
                </g>
              );
            })}

            {/* Area fill */}
            {areaStr && <path d={areaStr} fill="url(#adminActivityGradient)" />}

            {/* Main hours line */}
            {pathStr && <path d={pathStr} fill="none" stroke="#32D6B0" strokeWidth="2.5" />}

            {/* Interactive Points */}
            {points.map((pt, i) => (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r={activeIdx === i ? '6' : '4'}
                fill="#32D6B0"
                stroke="#151A18"
                strokeWidth="2"
                className="cursor-pointer transition-all"
                onMouseEnter={() => setActiveIdx(i)}
                onMouseLeave={() => setActiveIdx(null)}
              />
            ))}

            {/* X-axis labels */}
            {points.map((pt, i) => (
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

          {/* Active Hover Detail */}
          {activeIdx !== null && data[activeIdx] && (
            <div className="mt-2 p-2.5 bg-[#1B211E] border border-[#29312C] rounded-lg text-xs flex items-center justify-between animate-in fade-in">
              <span className="font-semibold text-[#F5F7F6]">{data[activeIdx].week} Metrics</span>
              <div className="flex items-center gap-4">
                <span className="text-[#32D6B0] font-mono font-bold">
                  {data[activeIdx].totalHours} Study Hours
                </span>
                <span className="text-[#F2D64B] font-mono font-bold">
                  {data[activeIdx].activeLogins} Active Logins
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[#29312C] flex items-center justify-between text-[11px] text-[#A3ADA7]">
        <span>
          Current Weekly Total:{' '}
          <strong className="text-[#F5F7F6] font-mono">{latestData?.totalHours || 0} Hours</strong>
        </span>
        <span className="text-[#78D98A] font-semibold flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" /> +15.2% vs baseline week
        </span>
      </div>
    </div>
  );
};
