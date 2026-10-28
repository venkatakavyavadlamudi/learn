import React from 'react';

interface CourseEnrollmentData {
  courseTitle: string;
  studentsCount: number;
  capacity: number;
}

interface StudentsByCourseChartProps {
  data: CourseEnrollmentData[];
  title?: string;
  subtitle?: string;
}

export const StudentsByCourseChart: React.FC<StudentsByCourseChartProps> = ({
  data,
  title = 'Students by Course & Cohort Capacity',
  subtitle = 'Active learner enrollment distribution across institution curricula',
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
            Loading course enrollment data...
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
          <span className="text-[11px] font-mono text-[#32D6B0]">Capacity Ratio</span>
        </div>

        <div className="mt-4 space-y-3.5">
          {data.map((item) => {
            const pct = Math.round((item.studentsCount / item.capacity) * 100);
            return (
              <div key={item.courseTitle} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#F5F7F6] line-clamp-1">{item.courseTitle}</span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-[#32D6B0] font-bold">{item.studentsCount}</span>
                    <span className="text-[#A3ADA7]">/ {item.capacity}</span>
                    <span className="text-[#A3ADA7]">({pct}%)</span>
                  </div>
                </div>

                <div className="w-full bg-[#0A0D0C] rounded-full h-2.5 overflow-hidden border border-[#29312C]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, pct)}%`,
                      background:
                        pct >= 90
                          ? 'linear-gradient(90deg, #32D6B0 0%, #F2D64B 100%)'
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
        <span>Total Active Enrollments: <strong className="text-[#F5F7F6] font-mono">{data.reduce((a, b) => a + b.studentsCount, 0)}</strong></span>
        <span className="text-[#78D98A]">Average utilization: 86%</span>
      </div>
    </div>
  );
};
