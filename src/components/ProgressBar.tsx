import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  colorClass?: string;
  heightClass?: string;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  colorClass = 'gradient-uniconnect',
  heightClass = 'h-1.5',
  showLabel = false,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-medium text-[#A3ADA7] mb-1">
          <span>Progress</span>
          <span className="font-semibold text-[#32D6B0]">{clampedProgress}%</span>
        </div>
      )}
      <div className={`w-full bg-[#1B211E] rounded-full overflow-hidden ${heightClass} border border-[#29312C]/40`}>
        <div
          className={`${heightClass} rounded-full transition-all duration-500 ease-out ${colorClass}`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};
