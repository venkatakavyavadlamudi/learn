import React, { useState } from 'react';

interface AttemptData {
  attempt: string;
  avgScore: number;
  cohortAvg: number;
}

interface MockInterviewTrendChartProps {
  data: AttemptData[];
  title?: string;
  subtitle?: string;
}

export const MockInterviewTrendChart: React.FC<MockInterviewTrendChartProps> = ({
  data,
  title = 'Mock Interview Scores by Attempt',
  subtitle = 'Track mentee score trajectory across interview rounds vs cohort average',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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
            Loading mock interview data...
          </div>
        </div>
      </div>
    );
  }

  const height = 180;
  const maxScore = 100;

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
              <span className="w-2.5 h-2.5 rounded-sm bg-[#32D6B0]" />
              <span className="text-[#A3ADA7]">Mentees Avg</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#78D98A]/40 border border-[#78D98A]" />
              <span className="text-[#A3ADA7]">Cohort Target</span>
            </div>
          </div>
        </div>

        {/* Chart Area */}
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-4 gap-3 items-end h-44 px-2 pt-6 pb-2 bg-[#0A0D0C]/40 rounded-xl border border-[#29312C]/60">
            {data.map((item, idx) => {
              const studentHeight = (item.avgScore / maxScore) * height;
              const cohortHeight = (item.cohortAvg / maxScore) * height;
              const isHovered = hoveredIndex === idx;

              return (
                <div
                  key={item.attempt}
                  className="flex flex-col items-center justify-end h-full gap-2 relative group cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div className="absolute -top-12 z-20 bg-[#1B211E] border border-[#29312C] text-xs px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap text-center animate-in fade-in duration-100">
                      <p className="font-semibold text-[#F5F7F6]">{item.attempt}</p>
                      <div className="flex items-center justify-center gap-2 text-[10px] mt-0.5">
                        <span className="text-[#32D6B0]">Mentees: {item.avgScore}%</span>
                        <span className="text-[#A3ADA7]">·</span>
                        <span className="text-[#78D98A]">Target: {item.cohortAvg}%</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-end justify-center gap-1.5 w-full h-full max-w-[64px]">
                    {/* Mentee Bar */}
                    <div className="w-1/2 flex flex-col items-center justify-end h-full">
                      <span className="text-[10px] font-bold text-[#32D6B0] mb-1">
                        {item.avgScore}%
                      </span>
                      <div
                        className="w-full rounded-t-md transition-all duration-300"
                        style={{
                          height: `${studentHeight}px`,
                          background: isHovered
                            ? 'linear-gradient(180deg, #F2D64B 0%, #32D6B0 100%)'
                            : 'linear-gradient(180deg, #32D6B0 0%, #151A18 100%)',
                        }}
                      />
                    </div>

                    {/* Cohort Benchmark Bar */}
                    <div className="w-1/2 flex flex-col items-center justify-end h-full">
                      <span className="text-[10px] font-medium text-[#A3ADA7] mb-1">
                        {item.cohortAvg}%
                      </span>
                      <div
                        className="w-full bg-[#1B211E] border border-[#78D98A]/50 rounded-t-md transition-all duration-300"
                        style={{ height: `${cohortHeight}px` }}
                      />
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-[#A3ADA7] tracking-tight">
                    {item.attempt}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-[#A3ADA7] px-2">
            <span>Pass Threshold: <strong className="text-[#F5F7F6]">75%</strong></span>
            <span className="text-[#78D98A] font-medium">+31% average growth from Round 1 to Round 4</span>
          </div>
        </div>
      </div>
    </div>
  );
};
