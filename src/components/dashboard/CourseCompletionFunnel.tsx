import React from 'react';
import { Award, ChevronRight } from 'lucide-react';

interface FunnelStage {
  stage: string;
  count: number;
  percent: number;
}

interface CourseCompletionFunnelProps {
  data: FunnelStage[];
  title?: string;
  subtitle?: string;
}

export const CourseCompletionFunnel: React.FC<CourseCompletionFunnelProps> = ({
  data,
  title = 'Course Completion Funnel',
  subtitle = 'Progression pipeline from initial student enrollment to credential certification',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-[#151A18] border border-[#29312C] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#29312C]">
            <div>
              <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">{title}</h3>
              {subtitle && <p className="text-xs text-[#A3ADA7] mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <div className="h-44 flex items-center justify-center text-xs text-[#A3ADA7]">
            Loading completion funnel...
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="p-5 rounded-2xl bg-[#151A18] border border-[#29312C] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#29312C]">
          <div>
            <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">{title}</h3>
            {subtitle && <p className="text-xs text-[#A3ADA7] mt-0.5">{subtitle}</p>}
          </div>
          <span className="text-[11px] font-mono text-[#F2D64B] flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            <span>Graduation Pipeline</span>
          </span>
        </div>

        <div className="mt-4 space-y-2.5">
          {data.map((stage, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === data.length - 1;

            return (
              <div
                key={stage.stage}
                className="p-3 rounded-xl bg-[#0A0D0C] border border-[#29312C] flex items-center justify-between relative overflow-hidden"
              >
                {/* Background width indicator */}
                <div
                  className="absolute inset-y-0 left-0 opacity-15 pointer-events-none transition-all duration-500"
                  style={{
                    width: `${stage.percent}%`,
                    background: isLast
                      ? 'linear-gradient(90deg, #32D6B0, #F2D64B)'
                      : 'linear-gradient(90deg, #32D6B0, #78D98A)',
                  }}
                />

                <div className="relative z-10 flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#1B211E] border border-[#29312C] text-[#32D6B0] text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-[#F5F7F6]">{stage.stage}</span>
                </div>

                <div className="relative z-10 flex items-center gap-3 font-mono text-xs">
                  <span className="text-[#A3ADA7]">{stage.count} students</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      isLast
                        ? 'bg-[#32D6B0]/10 text-[#32D6B0] border border-[#32D6B0]/30'
                        : 'text-[#F5F7F6]'
                    }`}
                  >
                    {stage.percent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#29312C] flex items-center justify-between text-[11px] text-[#A3ADA7]">
        <span>Enrollment-to-Certification Rate</span>
        <span className="text-[#32D6B0] font-semibold">25.3% (Top quartile academic benchmark)</span>
      </div>
    </div>
  );
};
