import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
      <div className="p-5 rounded-2xl bg-[#151A18] border border-[#29312C] shadow-sm flex flex-col justify-between h-full">
        <div>
          <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">{title}</h3>
          {subtitle && <p className="text-xs text-[#A3ADA7] mt-0.5">{subtitle}</p>}
          <div className="h-64 flex items-center justify-center text-xs text-[#A3ADA7]">
            Loading readiness mix data...
          </div>
        </div>
      </div>
    );
  }

  const chartData = data.map(d => {
    const total = d.jobReadyCount + d.onTrackCount + d.atRiskCount;
    return {
      name: d.courseTitle,
      'Job Ready': total > 0 ? Math.round((d.jobReadyCount / total) * 100) : 0,
      'On Track': total > 0 ? Math.round((d.onTrackCount / total) * 100) : 0,
      'Needs Support': total > 0 ? Math.round((d.atRiskCount / total) * 100) : 0,
      raw: { jobReady: d.jobReadyCount, onTrack: d.onTrackCount, atRisk: d.atRiskCount }
    };
  });

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
            stackOffset="expand"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#29312C" />
            <XAxis type="number" tickFormatter={(val) => `${Math.round(val * 100)}%`} fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#A3ADA7' }} />
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
                color: '#F5F7F6'
              }}
              formatter={(value: any, name: any) => [`${value}%`, name]}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px', color: '#A3ADA7' }} />
            <Bar dataKey="Job Ready" stackId="a" fill="#32D6B0" radius={[0, 0, 0, 0]} barSize={20} />
            <Bar dataKey="On Track" stackId="a" fill="#B4E85A" barSize={20} />
            <Bar dataKey="Needs Support" stackId="a" fill="#FF7272" radius={[0, 4, 4, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-[#29312C] flex items-center justify-between text-[11px] text-[#A3ADA7]">
        <span>Benchmark: <strong className="text-[#F5F7F6]">&gt;60% Job Ready</strong></span>
        <span className="text-[#32D6B0] font-semibold">Institutional Health: Good</span>
      </div>
    </div>
  );
};

