import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  delta?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  subtitle?: string;
  icon: LucideIcon;
  accentColor?: 'teal' | 'lime' | 'yellow' | 'red';
  accent?: 'teal' | 'lime' | 'yellow' | 'red' | string;
  onClick?: () => void;
  active?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit,
  delta,
  trend,
  subtitle,
  icon: Icon,
  accentColor,
  accent: accentProp = 'teal',
  onClick,
  active = false,
}) => {
  const effectiveAccent = accentColor || accentProp || 'teal';
  const effectiveDelta = delta || trend;

  const getAccent = () => {
    switch (effectiveAccent) {
      case 'lime':
        return {
          bg: 'bg-[#152317]',
          text: 'text-[#B4E85A]',
          border: 'border-[#B4E85A]/30',
          glow: 'hover:border-[#B4E85A]/50',
        };
      case 'yellow':
        return {
          bg: 'bg-[#232014]',
          text: 'text-[#F2D64B]',
          border: 'border-[#F2D64B]/30',
          glow: 'hover:border-[#F2D64B]/50',
        };
      case 'red':
        return {
          bg: 'bg-[#261517]',
          text: 'text-[#FF7272]',
          border: 'border-[#FF7272]/30',
          glow: 'hover:border-[#FF7272]/50',
        };
      case 'teal':
      default:
        return {
          bg: 'bg-[#101F1B]',
          text: 'text-[#32D6B0]',
          border: 'border-[#32D6B0]/30',
          glow: 'hover:border-[#32D6B0]/50',
        };
    }
  };

  const accent = getAccent();

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`relative p-5 rounded-2xl bg-[#151A18] border transition-all text-left ${
        active
          ? `${accent.border} ring-1 ${accent.border} shadow-lg`
          : 'border-[#29312C] hover:border-[#3a453f]'
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-[#A3ADA7] tracking-wide">{title}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accent.bg} ${accent.text}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl sm:text-3xl font-bold font-['Outfit'] tracking-tight text-[#F5F7F6]">
          {value}
        </span>
        {unit && <span className="text-xs font-semibold text-[#A3ADA7]">{unit}</span>}
      </div>

      {(effectiveDelta || subtitle) && (
        <div className="mt-2.5 flex items-center justify-between text-xs text-[#A3ADA7] border-t border-[#29312C]/60 pt-2.5">
          {effectiveDelta && (
            <div className="flex items-center gap-1 font-medium">
              {effectiveDelta.isPositive ? (
                <TrendingUp className="w-3.5 h-3.5 text-[#32D6B0]" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-[#FF7272]" />
              )}
              <span className={effectiveDelta.isPositive ? 'text-[#32D6B0]' : 'text-[#FF7272]'}>
                {effectiveDelta.value}
              </span>
              {effectiveDelta.label && <span className="text-[#A3ADA7] text-[11px] ml-0.5">{effectiveDelta.label}</span>}
            </div>
          )}
          {subtitle && <span className="text-[11px] text-[#A3ADA7] truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
