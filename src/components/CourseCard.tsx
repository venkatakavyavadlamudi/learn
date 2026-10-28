import React from 'react';
import { Course } from '../types';
import { ProgressBar } from './ProgressBar';
import { Clock, Play, BookOpen, Award } from 'lucide-react';

interface CourseCardProps {
  course: Course;
  onContinue: (course: Course) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onContinue }) => {
  return (
    <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-5 shadow-card hover:border-[#32D6B0]/50 transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Header Badge & Category */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-[#1B211E] text-[#A3ADA7] border border-[#29312C]">
            {course.category}
          </span>
          <span className="text-xs font-bold text-[#32D6B0] bg-[#1B211E] px-2 py-0.5 rounded border border-[#29312C]">
            {course.progress}% Completed
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-[#F5F7F6] group-hover:text-[#32D6B0] transition-colors line-clamp-1 font-['Outfit']">
          {course.title}
        </h3>
        <p className="text-xs text-[#A3ADA7] mt-1 line-clamp-2 leading-relaxed">
          {course.description}
        </p>

        {/* Progress Bar */}
        <div className="mt-4 mb-2">
          <ProgressBar progress={course.progress || 0} colorClass="gradient-uniconnect" heightClass="h-1.5" />
        </div>

        {/* Meta details */}
        <div className="flex items-center justify-between text-[11px] text-[#A3ADA7] pt-2 border-t border-[#29312C]">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-[#32D6B0]" />
            {course.completedLessons}/{course.totalLessons} Lessons
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#A3ADA7]" />
            {course.lastActivity}
          </span>
        </div>

        {course.nextTopic && (
          <div className="mt-3 bg-[#101412] rounded-lg p-2.5 text-xs text-[#F5F7F6] border border-[#29312C] flex items-start gap-2">
            <Award className="w-4 h-4 text-[#F2D64B] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#F5F7F6]">Next topic: </span>
              <span className="text-[#A3ADA7]">{course.nextTopic}</span>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 mt-3 border-t border-[#29312C]">
        <button
          onClick={() => onContinue(course)}
          className="w-full py-2 px-3 rounded-lg text-xs font-bold gradient-uniconnect text-[#0A0D0C] hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer glow-teal-sm"
        >
          <Play className="w-3 h-3 fill-current text-[#0A0D0C]" />
          <span>Continue Lesson</span>
        </button>
      </div>
    </div>
  );
};
