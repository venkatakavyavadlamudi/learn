import React, { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  iconBgColor?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = 'bg-[#1B211E] text-[#32D6B0]',
  trend,
}) => {
  return (
    <div className="bg-[#151A18] rounded-2xl p-5 border border-[#29312C] shadow-card hover:border-[#32D6B0]/40 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-[#A3ADA7] uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-[#F5F7F6] tracking-tight">
              {value}
            </span>
            {trend && (
              <span
                className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                  trend.positive
                    ? 'text-[#78D98A] bg-[#1B211E] border border-[#29312C]'
                    : 'text-[#FF7272] bg-[#1B211E] border border-[#29312C]'
                }`}
              >
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-[#A3ADA7] pt-0.5">{subtitle}</p>}
        </div>

        <div className={`w-11 h-11 rounded-xl ${iconBgColor} border border-[#29312C] flex items-center justify-center shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
