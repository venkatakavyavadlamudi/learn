import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface CourseEnrollmentData {
  courseTitle: string;
  studentsCount: number;
  capacity: number;
}

interface StudentsByCourseChartProps {
  data: CourseEnrollmentData[];
  title?: string;
  subtitle?: string;
  onCourseClick?: (courseTitle: string) => void;
}

export const StudentsByCourseChart: React.FC<StudentsByCourseChartProps> = ({
  data,
  title = 'Students by Course & Enrollment Counts',
  subtitle = 'Real-time student distribution across active institution curricula',
  onCourseClick,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-[#151A18] border border-[#29312C] shadow-sm flex flex-col justify-between h-full">
        <div>
          <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">{title}</h3>
          {subtitle && <p className="text-xs text-[#A3ADA7] mt-0.5">{subtitle}</p>}
          <div className="h-64 flex items-center justify-center text-xs text-[#A3ADA7]">
            Loading course enrollment data...
          </div>
        </div>
      </div>
    );
  }

  const chartData = data.map(d => ({
    name: d.courseTitle,
    students: d.studentsCount,
    capacity: d.capacity
  })).sort((a, b) => b.students - a.students);

  return (
    <div className="p-5 rounded-2xl bg-[#151A18] border border-[#29312C] shadow-sm flex flex-col justify-between h-full hover:border-[#32D6B0]/30 transition-all">
      <div>
        <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">{title}</h3>
        {subtitle && <p className="text-xs text-[#A3ADA7] mt-0.5">{subtitle}</p>}
      </div>

      <div className="h-72 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 40, left: 40, bottom: 5 }}
            onClick={(state) => {
              if (state && state.activeLabel && onCourseClick) {
                onCourseClick(String(state.activeLabel));
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#29312C" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={100} 
              axisLine={false} 
              tickLine={false} 
              fontSize={10} 
              fontWeight="medium"
              tick={{ fill: '#A3ADA7' }}
            />
            <Tooltip 
              cursor={{ fill: '#0A0D0C' }}
              contentStyle={{ 
                backgroundColor: '#151A18', 
                border: '1px solid #29312C', 
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#F5F7F6'
              }}
              itemStyle={{ color: '#32D6B0' }}
            />
            <Bar 
              dataKey="students" 
              fill="#32D6B0" 
              radius={[0, 4, 4, 0]}
              barSize={20}
            >
              <LabelList 
                dataKey="students" 
                position="right" 
                style={{ fill: '#F5F7F6', fontSize: '10px', fontWeight: 'bold' }} 
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-[#29312C] flex items-center justify-between text-[11px] text-[#A3ADA7]">
        <span>Total Enrolled: <strong className="text-[#F5F7F6]">{data.reduce((a, b) => a + b.studentsCount, 0)}</strong></span>
        <span className="text-[#32D6B0] font-semibold">Average: {Math.round(data.reduce((a, b) => a + b.studentsCount, 0) / data.length)} per course</span>
      </div>
    </div>
  );
};

