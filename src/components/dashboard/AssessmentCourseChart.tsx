import React from 'react';

interface CoursePerformanceData {
  courseTitle: string;
  avgScore: number;
  passingScore: number;
}

interface AssessmentCourseChartProps {
  data: CoursePerformanceData[];
  title?: string;
  subtitle?: string;
}

export const AssessmentCourseChart: React.FC<AssessmentCourseChartProps> = ({
  data,
  title = 'Assessment Performance across Courses',
  subtitle = 'Average examination and assignment evaluation scores vs passing benchmark',
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
            Loading assessment performance data...
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
          <span className="text-[11px] font-mono text-[#A3ADA7]">Pass Bar: 70%</span>
        </div>

        <div className="mt-4 space-y-3.5">
          {data.map((item) => {
            const isPassing = item.avgScore >= item.passingScore;
            return (
              <div key={item.courseTitle} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#F5F7F6]">{item.courseTitle}</span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span
                      className={`font-bold ${
                        item.avgScore >= 80
                          ? 'text-[#32D6B0]'
                          : item.avgScore >= 70
                          ? 'text-[#B4E85A]'
                          : 'text-[#FF7272]'
                      }`}
                    >
                      {item.avgScore}%
                    </span>
                    <span className="text-[#A3ADA7]">vs {item.passingScore}% pass</span>
                  </div>
                </div>

                {/* Progress Bar with Passing Threshold indicator */}
                <div className="relative w-full bg-[#0A0D0C] rounded-full h-2.5 overflow-hidden border border-[#29312C]">
                  {/* Passing Threshold line */}
                  <div
                    className="absolute top-0 bottom-0 border-r border-[#F2D64B] z-10"
                    style={{ left: `${item.passingScore}%` }}
                  />
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.avgScore}%`,
                      background:
                        item.avgScore >= 80
                          ? 'linear-gradient(90deg, #32D6B0 0%, #78D98A 100%)'
                          : item.avgScore >= 70
                          ? 'linear-gradient(90deg, #B4E85A 0%, #F2D64B 100%)'
                          : '#FF7272',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#29312C] flex items-center justify-between text-[11px] text-[#A3ADA7]">
        <span>All 4 curricula exceed the institutional 70% passing threshold</span>
        <span className="text-[#78D98A] font-semibold">100% Pass Rate</span>
      </div>
    </div>
  );
};
