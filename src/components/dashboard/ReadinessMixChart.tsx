import React from 'react';

interface ReadinessMixData {
  courseTitle: string;
  jobReadyCount: number;
  onTrackCount: number;
  atRiskCount: number;
}

interface ReadinessMixChartProps {
  data: ReadinessMixData[];
  title?: string;
  subtitle?: string;
}

export const ReadinessMixChart: React.FC<ReadinessMixChartProps> = ({
  data,
  title = 'Readiness Mix by Course',
  subtitle = 'Job Ready (≥80%), On Track (60–79%), and At Risk (<60%) student distribution',
}) => {
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
            Loading readiness mix data...
          </div>
        </div>
      </div>
    );
  }
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
              <span className="w-2.5 h-2.5 rounded-sm bg-[#32D6B0]" />
              <span className="text-[#A3ADA7]">Job Ready</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#B4E85A]" />
              <span className="text-[#A3ADA7]">On Track</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#FF7272]" />
              <span className="text-[#A3ADA7]">At Risk</span>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3.5">
          {data.map((item) => {
            const total = item.jobReadyCount + item.onTrackCount + item.atRiskCount;
            const jobReadyPct = total > 0 ? (item.jobReadyCount / total) * 100 : 0;
            const onTrackPct = total > 0 ? (item.onTrackCount / total) * 100 : 0;
            const atRiskPct = total > 0 ? (item.atRiskCount / total) * 100 : 0;

            return (
              <div key={item.courseTitle} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#F5F7F6]">{item.courseTitle}</span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-[#32D6B0]">{item.jobReadyCount} ready</span>
                    <span className="text-[#A3ADA7]">·</span>
                    <span className="text-[#B4E85A]">{item.onTrackCount} track</span>
                    <span className="text-[#A3ADA7]">·</span>
                    <span className="text-[#FF7272]">{item.atRiskCount} risk</span>
                  </div>
                </div>

                {/* Stacked bar */}
                <div className="w-full bg-[#0A0D0C] rounded-full h-3 overflow-hidden flex border border-[#29312C]">
                  <div
                    className="h-full bg-[#32D6B0] transition-all duration-500"
                    style={{ width: `${jobReadyPct}%` }}
                    title={`Job Ready: ${item.jobReadyCount} (${Math.round(jobReadyPct)}%)`}
                  />
                  <div
                    className="h-full bg-[#B4E85A] transition-all duration-500"
                    style={{ width: `${onTrackPct}%` }}
                    title={`On Track: ${item.onTrackCount} (${Math.round(onTrackPct)}%)`}
                  />
                  <div
                    className="h-full bg-[#FF7272] transition-all duration-500"
                    style={{ width: `${atRiskPct}%` }}
                    title={`At Risk: ${item.atRiskCount} (${Math.round(atRiskPct)}%)`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#29312C] flex items-center justify-between text-[11px] text-[#A3ADA7]">
        <span>Target benchmark: &gt;50% Job Ready</span>
        <span className="text-[#32D6B0] font-semibold">Generative AI leading with 54%</span>
      </div>
    </div>
  );
};
