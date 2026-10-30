import React, { useState } from 'react';
import { Target, Layers, ArrowUpRight } from 'lucide-react';

export interface SkillItem {
  name: string;
  current: number; // 0 - 100
  target: number; // 0 - 100
  gap?: number;
  category?: string;
}

interface SkillsComparisonChartProps {
  skills: SkillItem[];
  title?: string;
  subtitle?: string;
  onSkillSelect?: (skill: SkillItem) => void;
}

export const SkillsComparisonChart: React.FC<SkillsComparisonChartProps> = ({
  skills = [],
  title = 'My Skills vs Target Skills',
  subtitle = 'Current verified competency vs industry hiring benchmark',
  onSkillSelect,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeSkill, setActiveSkill] = useState<string | null>(null);

  const safeSkills = skills || [];

  if (safeSkills.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-[#151A18] border border-[#29312C] flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#29312C]">
            <div>
              <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">{title}</h3>
              <p className="text-xs text-[#A3ADA7] mt-0.5">{subtitle}</p>
            </div>
          </div>
          <div className="h-48 flex flex-col items-center justify-center text-center p-4">
            <div className="w-10 h-10 rounded-xl bg-[#101412] border border-[#29312C] flex items-center justify-center text-[#32D6B0] mb-2">
              <Layers className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-[#F5F7F6]">No Skill Assessments Yet</p>
            <p className="text-[11px] text-[#A3ADA7] max-w-xs mt-1">
              Complete diagnostic skill assessments to benchmark your competencies against industry requirements.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const categories = ['All', ...Array.from(new Set(safeSkills.map((s) => s.category || 'General')))];

  const filteredSkills = selectedCategory === 'All'
    ? safeSkills
    : safeSkills.filter((s) => (s.category || 'General') === selectedCategory);

  return (
    <div className="p-5 rounded-2xl bg-[#151A18] border border-[#29312C] flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#29312C]">
          <div>
            <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">{title}</h3>
            <p className="text-xs text-[#A3ADA7] mt-0.5">{subtitle}</p>
          </div>

          {/* Category filter pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#1B211E] text-[#32D6B0] border border-[#32D6B0]/30'
                    : 'text-[#A3ADA7] hover:text-[#F5F7F6]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 mb-2 text-[11px] text-[#A3ADA7]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#32D6B0]" />
            <span>Current Competency</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#B4E85A]/40 border border-[#B4E85A]" />
            <span>Target Benchmark</span>
          </div>
        </div>

        {/* Horizontal Bars */}
        <div className="space-y-3.5 mt-3">
          {filteredSkills.map((skill, idx) => {
            const gap = skill.current - skill.target;
            const isAhead = gap >= 0;
            const isSelected = activeSkill === skill.name;

            return (
              <div
                key={`${skill.name || 'skill'}-${idx}`}
                onClick={() => {
                  setActiveSkill(isSelected ? null : skill.name);
                  onSkillSelect?.(skill);
                }}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1B211E] border-[#32D6B0]/50 shadow-md'
                    : 'bg-[#101412] border-[#29312C]/60 hover:border-[#3a453f]'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#F5F7F6]">{skill.name}</span>
                    {skill.category && (
                      <span className="text-[10px] text-[#A3ADA7]">· {skill.category}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="font-bold text-[#32D6B0]">{skill.current}%</span>
                    <span className="text-[#A3ADA7]">/ {skill.target}%</span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                        isAhead
                          ? 'bg-[#101F1B] text-[#32D6B0]'
                          : 'bg-[#261517] text-[#FF7272]'
                      }`}
                    >
                      {isAhead ? `+${gap}%` : `${gap}%`}
                    </span>
                  </div>
                </div>

                {/* Overlaid Horizontal Bar Visual */}
                <div className="relative w-full h-3 rounded-full bg-[#1B211E] overflow-hidden">
                  {/* Target benchmark shadow bar */}
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-[#B4E85A]/20 border-r-2 border-[#B4E85A] rounded-full"
                    style={{ width: `${Math.min(100, skill.target)}%` }}
                  />
                  {/* Current score bar */}
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#32D6B0] to-[#78D98A] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, skill.current)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-[#29312C] flex items-center justify-between text-xs text-[#A3ADA7]">
        <span>Tap any skill row to view targeted practice roadmap</span>
        <ArrowUpRight className="w-3.5 h-3.5 text-[#32D6B0]" />
      </div>
    </div>
  );
};
