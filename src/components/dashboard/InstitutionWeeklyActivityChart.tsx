import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { Clock, TrendingUp } from 'lucide-react';

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
  title = 'Average Weekly Study Hours by Program Week',
  subtitle = 'Total active student learning hours and unique daily active logins',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-[#151A18] border border-[#29312C] shadow-sm flex flex-col justify-between h-full">
        <div>
          <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">{title}</h3>
          {subtitle && <p className="text-xs text-[#A3ADA7] mt-0.5">{subtitle}</p>}
          <div className="h-64 flex items-center justify-center text-xs text-[#A3ADA7]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#32D6B0] animate-pulse" />
              <span>Loading engagement activity metrics...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const latestData = data[data.length - 1];

  return (
    <div className="p-5 rounded-2xl bg-[#151A18] border border-[#29312C] shadow-sm flex flex-col justify-between h-full hover:border-[#32D6B0]/30 transition-all">
      <div>
        <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">{title}</h3>
        {subtitle && <p className="text-xs text-[#A3ADA7] mt-0.5">{subtitle}</p>}
      </div>

      <div className="h-72 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#32D6B0" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#32D6B0" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#29312C" />
            <XAxis 
              dataKey="week" 
              fontSize={10} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#A3ADA7' }}
            />
            <YAxis 
              fontSize={10} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#A3ADA7' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#151A18', 
                border: '1px solid #29312C', 
                borderRadius: '8px',
                fontSize: '12px',
                color: '#F5F7F6'
              }}
              itemStyle={{ color: '#32D6B0' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px', color: '#A3ADA7' }} />
            <Area 
              type="monotone" 
              dataKey="totalHours" 
              name="Study Hours" 
              stroke="#32D6B0" 
              fillOpacity={1} 
              fill="url(#colorHours)" 
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="activeLogins" 
              name="Active Logins" 
              stroke="#F2D64B" 
              strokeWidth={2} 
              dot={{ r: 4, fill: '#F2D64B' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-[#29312C] flex items-center justify-between text-[11px] text-[#A3ADA7]">
        <span>Current Weekly Total: <strong className="text-[#F5F7F6]">{latestData?.totalHours || 0} Hours</strong></span>
        <span className="text-[#32D6B0] font-semibold flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" /> Growth: +12%
        </span>
      </div>
    </div>
  );
};

