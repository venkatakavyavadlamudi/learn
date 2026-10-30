import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

export interface PracticeTopicItem {
  topic: string;
  accuracy: number; // 0 - 100
  questionsAnswered: number;
  isWeak: boolean;
  recommendation: string;
}

interface PracticeAccuracyBarChartProps {
  topics: PracticeTopicItem[];
  title?: string;
  subtitle?: string;
  onPracticeClick?: (topic: PracticeTopicItem) => void;
}

export const PracticeAccuracyBarChart: React.FC<PracticeAccuracyBarChartProps> = ({
  topics,
  title = 'Practice Accuracy by Topic',
  subtitle = 'Identify strengths and focus areas across problem domains',
  onPracticeClick,
}) => {
  const safeTopics = topics || [];

  if (safeTopics.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-[#151A18] border border-[#29312C] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#29312C]">
            <div>
              <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">{title}</h3>
              <p className="text-xs text-[#A3ADA7] mt-0.5">{subtitle}</p>
            </div>
            <span className="text-[11px] font-mono text-[#A3ADA7]">Benchmark: 75%</span>
          </div>
          <div className="h-48 flex flex-col items-center justify-center text-center p-4">
            <div className="w-10 h-10 rounded-xl bg-[#101412] border border-[#29312C] flex items-center justify-center text-[#32D6B0] mb-2">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-[#F5F7F6]">No Practice Drills Logged</p>
            <p className="text-[11px] text-[#A3ADA7] max-w-xs mt-1">
              Solve coding challenges and quizzes to analyze your accuracy across specific curriculum topics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const [selectedTopic, setSelectedTopic] = useState<PracticeTopicItem>(
    safeTopics.find((t) => t.isWeak) || safeTopics[0]
  );

  const getBarColor = (accuracy: number) => {
    if (accuracy >= 75) return 'bg-[#32D6B0] text-[#32D6B0]';
    if (accuracy >= 60) return 'bg-[#F2D64B] text-[#F2D64B]';
    return 'bg-[#FF7272] text-[#FF7272]';
  };

  return (
    <div className="p-5 rounded-2xl bg-[#151A18] border border-[#29312C] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#29312C]">
          <div>
            <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">{title}</h3>
            <p className="text-xs text-[#A3ADA7] mt-0.5">{subtitle}</p>
          </div>
          <span className="text-[11px] font-mono text-[#A3ADA7]">Benchmark: 75%</span>
        </div>

        {/* Vertical Bars Chart Container */}
        <div className="mt-4 pt-2 pb-2">
          <div className="grid grid-cols-5 gap-2 sm:gap-3 items-end h-40 border-b border-[#29312C] pb-2 relative">
            {/* Benchmark Guideline at 75% */}
            <div
              className="absolute left-0 right-0 border-b border-dashed border-[#F2D64B]/60 pointer-events-none z-0"
              style={{ bottom: '75%' }}
            >
              <span className="absolute -top-3.5 right-0 text-[9px] font-mono text-[#F2D64B]">75% Benchmark</span>
            </div>

            {topics.map((item, idx) => {
              const isSelected = selectedTopic?.topic === item.topic;
              const barColorClass = getBarColor(item.accuracy);

              return (
                <div
                  key={`${item.topic || 'topic'}-${idx}`}
                  onClick={() => setSelectedTopic(item)}
                  className="flex flex-col items-center h-full justify-end group cursor-pointer"
                >
                  {/* Tooltip on top of bar */}
                  <div
                    className={`text-[10px] font-mono font-bold mb-1 transition-transform group-hover:scale-110 ${
                      item.accuracy < 60 ? 'text-[#FF7272]' : item.accuracy >= 75 ? 'text-[#32D6B0]' : 'text-[#F2D64B]'
                    }`}
                  >
                    {item.accuracy}%
                  </div>

                  {/* Bar */}
                  <div className="w-full max-w-[42px] bg-[#1B211E] rounded-t-lg h-full flex items-end overflow-hidden p-0.5">
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${barColorClass.split(' ')[0]} ${
                        isSelected ? 'ring-2 ring-white/30 brightness-110' : 'group-hover:brightness-110'
                      }`}
                      style={{ height: `${Math.max(8, item.accuracy)}%` }}
                    />
                  </div>

                  {/* Label */}
                  <span
                    className={`text-[10px] text-center mt-2 truncate w-full transition-colors ${
                      isSelected ? 'text-[#32D6B0] font-bold' : 'text-[#A3ADA7] group-hover:text-[#F5F7F6]'
                    }`}
                    title={item.topic}
                  >
                    {item.topic}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Topic Recommendation Callout */}
      {selectedTopic && (
        <div className="mt-4 p-3.5 rounded-xl bg-[#101412] border border-[#29312C] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            {selectedTopic.isWeak ? (
              <AlertTriangle className="w-4 h-4 text-[#FF7272] shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#32D6B0] shrink-0 mt-0.5" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#F5F7F6]">{selectedTopic.topic}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                    selectedTopic.isWeak
                      ? 'bg-[#261517] text-[#FF7272]'
                      : 'bg-[#101F1B] text-[#32D6B0]'
                  }`}
                >
                  {selectedTopic.isWeak ? 'Action Recommended' : 'Mastered'}
                </span>
              </div>
              <p className="text-[11px] text-[#A3ADA7] mt-0.5">{selectedTopic.recommendation}</p>
            </div>
          </div>

          <button
            onClick={() => onPracticeClick?.(selectedTopic)}
            className="self-start sm:self-auto px-3.5 py-1.5 bg-[#1B211E] hover:bg-[#32D6B0] text-[#32D6B0] hover:text-[#0A0D0C] font-semibold rounded-lg border border-[#32D6B0]/30 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>Practise Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
