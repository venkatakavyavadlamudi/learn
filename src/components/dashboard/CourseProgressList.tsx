import React from 'react';
import { BookOpen, Play, CheckCircle2, ArrowRight } from 'lucide-react';

export interface CourseProgressItem {
  id: string;
  title: string;
  category: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  nextTopic: string;
  difficulty?: string;
}

interface CourseProgressListProps {
  courses: CourseProgressItem[];
  title?: string;
  subtitle?: string;
  onSelectCourse?: (courseId: string) => void;
}

export const CourseProgressList: React.FC<CourseProgressListProps> = ({
  courses,
  title = 'Enrolled Courses & Milestones',
  subtitle = 'Track completion, upcoming lessons, and syllabus modules',
  onSelectCourse,
}) => {
  const safeCourses = courses || [];

  return (
    <div className="p-5 rounded-2xl bg-[#151A18] border border-[#29312C] space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#29312C]">
        <div>
          <h3 className="text-sm font-bold font-['Outfit'] text-[#F5F7F6]">{title}</h3>
          <p className="text-xs text-[#A3ADA7] mt-0.5">{subtitle}</p>
        </div>
        <span className="text-xs font-mono text-[#32D6B0]">{safeCourses.length} Active Tracks</span>
      </div>

      {safeCourses.length === 0 ? (
        <div className="h-36 flex flex-col items-center justify-center text-center p-4 rounded-xl bg-[#101412] border border-[#29312C]">
          <BookOpen className="w-6 h-6 text-[#32D6B0] mb-2" />
          <p className="text-xs font-semibold text-[#F5F7F6]">No Active Course Enrollments</p>
          <p className="text-[11px] text-[#A3ADA7] mt-0.5">Explore curriculum courses to enroll and track your syllabus progress.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {safeCourses.map((course) => (
          <div
            key={course.id}
            onClick={() => onSelectCourse?.(course.id)}
            className="p-3.5 rounded-xl bg-[#101412] border border-[#29312C] hover:border-[#32D6B0]/40 transition-all cursor-pointer group"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-[#F5F7F6] group-hover:text-[#32D6B0] transition-colors">
                    {course.title}
                  </span>
                  <span className="text-[10px] text-[#A3ADA7]">· {course.category}</span>
                </div>
                <p className="text-xs text-[#A3ADA7] mt-1 flex items-center gap-1.5">
                  <Play className="w-3 h-3 text-[#32D6B0]" />
                  <span>Next: <strong className="text-[#F5F7F6]">{course.nextTopic}</strong></span>
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs shrink-0 mt-2 sm:mt-0">
                <div className="text-right">
                  <span className="font-bold text-[#F5F7F6]">{course.progress}%</span>
                  <span className="text-[11px] text-[#A3ADA7] block">
                    {course.completedLessons} / {course.totalLessons} lessons
                  </span>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-[#1B211E] text-[#32D6B0] group-hover:bg-[#32D6B0] group-hover:text-[#0A0D0C] font-semibold text-xs transition-colors flex items-center gap-1 shrink-0"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 w-full h-2 rounded-full bg-[#1B211E] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#32D6B0] via-[#78D98A] to-[#F2D64B] transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, course.progress))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};
