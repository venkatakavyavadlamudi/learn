import React from 'react';
import { HelpCircle, AlertCircle } from 'lucide-react';

interface TopicDoubtItem {
  topic: string;
  count: number;
  percentage: number;
}

interface TopicDoubtsChartProps {
  data: TopicDoubtItem[];
  title?: string;
  subtitle?: string;
}

export const TopicDoubtsChart: React.FC<TopicDoubtsChartProps> = ({
  data,
  title = 'Most-Asked Doubt Topics & Conceptual Blockers',
  subtitle = 'High-frequency student struggle areas requiring remedial instructional focus',
}) => {
  return (
    <div className="p-5 rounded-2xl bg-[#151A18] border border-[#29312C] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#29312C]">
          <div>
            <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">{title}</h3>
            {subtitle && <p className="text-xs text-[#A3ADA7] mt-0.5">{subtitle}</p>}
          </div>
          <span className="text-[11px] font-mono text-[#F2D64B] flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Top Inquiries</span>
          </span>
        </div>

        <div className="mt-4 space-y-3.5">
          {data.map((item, idx) => {
            const isTop = idx === 0;
            return (
              <div key={item.topic} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[#A3ADA7]">0{idx + 1}.</span>
                    <span className="font-semibold text-[#F5F7F6]">{item.topic}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-[#A3ADA7]">{item.count} queries</span>
                    <span className="font-bold text-[#32D6B0]">{item.percentage}%</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#0A0D0C] rounded-full h-2 overflow-hidden border border-[#29312C]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      background: isTop
                        ? 'linear-gradient(90deg, #FF7272 0%, #F2D64B 100%)'
                        : 'linear-gradient(90deg, #32D6B0 0%, #78D98A 100%)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#29312C] flex items-center justify-between text-[11px] text-[#A3ADA7]">
        <span className="flex items-center gap-1.5 text-[#F2D64B]">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Instructors recommended: Schedule live Q&A for Top 2 topics</span>
        </span>
      </div>
    </div>
  );
};
