import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DoubtResolutionData {
  name: string;
  value: number;
}

interface DoubtResolutionDonutProps {
  data: DoubtResolutionData[];
  title?: string;
  subtitle?: string;
}

export const DoubtResolutionDonut: React.FC<DoubtResolutionDonutProps> = ({
  data,
  title = 'Doubts Resolved by AI Tutor vs Mentors & Trainers',
  subtitle = 'Distribution of resolved student inquiries across support channels',
}) => {
  const COLORS = ['#32D6B0', '#38BDF8', '#78D98A'];

  if (!data || data.length === 0 || data.every(d => d.value === 0)) {
    return (
      <div className="p-5 rounded-2xl bg-[#151A18] border border-[#29312C] shadow-sm flex flex-col justify-between h-full">
        <div>
          <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">{title}</h3>
          {subtitle && <p className="text-xs text-[#A3ADA7] mt-0.5">{subtitle}</p>}
          <div className="h-64 flex items-center justify-center text-xs text-[#A3ADA7]">
            No doubt resolution data available yet.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-[#151A18] border border-[#29312C] shadow-sm flex flex-col justify-between h-full hover:border-[#32D6B0]/30 transition-all">
      <div>
        <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">{title}</h3>
        {subtitle && <p className="text-xs text-[#A3ADA7] mt-0.5">{subtitle}</p>}
      </div>

      <div className="h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
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
            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: '#A3ADA7' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-3 border-t border-[#29312C] flex items-center justify-between text-[11px] text-[#A3ADA7]">
        <span>Total Resolved: <strong className="text-[#F5F7F6]">{data.reduce((a, b) => a + b.value, 0)}</strong></span>
        <span className="text-[#32D6B0] font-semibold">AI Efficiency: {Math.round((data.find(d => d.name === 'AI Tutor')?.value || 0) / (data.reduce((a, b) => a + b.value, 0) || 1) * 100)}%</span>
      </div>
    </div>
  );
};
