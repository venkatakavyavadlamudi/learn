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
  light?: boolean;
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
  light = false,
}) => {
  const effectiveAccent = accentColor || accentProp || 'teal';
  const effectiveDelta = delta || trend;

  const getAccent = () => {
    switch (effectiveAccent) {
      case 'lime':
        return {
          bg: light ? 'bg-[#ECFDF5]' : 'bg-[#152317]',
          text: light ? 'text-[#059669]' : 'text-[#B4E85A]',
          border: light ? 'border-[#A7F3D0]' : 'border-[#B4E85A]/30',
          glow: light ? 'hover:border-[#059669]/50' : 'hover:border-[#B4E85A]/50',
        };
      case 'yellow':
        return {
          bg: light ? 'bg-[#FFFBEB]' : 'bg-[#232014]',
          text: light ? 'text-[#D97706]' : 'text-[#F2D64B]',
          border: light ? 'border-[#FDE68A]' : 'border-[#F2D64B]/30',
          glow: light ? 'hover:border-[#D97706]/50' : 'hover:border-[#F2D64B]/50',
        };
      case 'red':
        return {
          bg: light ? 'bg-[#FEF2F2]' : 'bg-[#261517]',
          text: light ? 'text-[#DC2626]' : 'text-[#FF7272]',
          border: light ? 'border-[#FECACA]' : 'border-[#FF7272]/30',
          glow: light ? 'hover:border-[#DC2626]/50' : 'hover:border-[#FF7272]/50',
        };
      case 'teal':
      default:
        return {
          bg: light ? 'bg-[#F0FDFA]' : 'bg-[#101F1B]',
          text: light ? 'text-[#0D9488]' : 'text-[#32D6B0]',
          border: light ? 'border-[#CCFBF1]' : 'border-[#32D6B0]/30',
          glow: light ? 'hover:border-[#0D9488]/50' : 'hover:border-[#32D6B0]/50',
        };
    }
  };

  const accent = getAccent();

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`relative p-5 rounded-2xl border transition-all text-left ${
        light ? 'bg-white shadow-sm' : 'bg-[#151A18]'
      } ${
        active
          ? `${accent.border} ring-1 ${accent.border} shadow-lg`
          : `${light ? 'border-[#E2E8F0]' : 'border-[#29312C]'} ${accent.glow}`
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={`text-xs font-medium tracking-wide ${light ? 'text-[#64748B]' : 'text-[#A3ADA7]'}`}>
          {title}
        </span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accent.bg} ${accent.text}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className={`text-2xl sm:text-3xl font-bold font-['Outfit'] tracking-tight ${light ? 'text-[#0F172A]' : 'text-[#F5F7F6]'}`}>
          {value}
        </span>
        {unit && <span className={`text-xs font-semibold ${light ? 'text-[#64748B]' : 'text-[#A3ADA7]'}`}>{unit}</span>}
      </div>

      {(effectiveDelta || subtitle) && (
        <div className={`mt-2.5 flex items-center justify-between text-xs border-t pt-2.5 ${
          light ? 'text-[#64748B] border-[#F1F5F9]' : 'text-[#A3ADA7] border-[#29312C]/60'
        }`}>
          {effectiveDelta && (
            <div className="flex items-center gap-1 font-medium">
              {effectiveDelta.isPositive ? (
                <TrendingUp className={`w-3.5 h-3.5 ${light ? 'text-[#059669]' : 'text-[#32D6B0]'}`} />
              ) : (
                <TrendingDown className={`w-3.5 h-3.5 ${light ? 'text-[#DC2626]' : 'text-[#FF7272]'}`} />
              )}
              <span className={effectiveDelta.isPositive ? (light ? 'text-[#059669]' : 'text-[#32D6B0]') : (light ? 'text-[#DC2626]' : 'text-[#FF7272]')}>
                {effectiveDelta.value}
              </span>
              {effectiveDelta.label && <span className={`${light ? 'text-[#64748B]' : 'text-[#A3ADA7]'} text-[11px] ml-0.5`}>{effectiveDelta.label}</span>}
            </div>
          )}
          {subtitle && <span className="text-[11px] truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
