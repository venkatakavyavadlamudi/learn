import React from 'react';
import { Course } from '../types';
import { X, CheckCircle2, Circle, Clock, Bot, User } from 'lucide-react';

interface CourseModalProps {
  course: Course | null;
  onClose: () => void;
  onToggleLesson: (courseId: string, lessonId: string) => void;
  onAskAiAboutCourse?: (courseTitle: string, lessonTopic?: string) => void;
}

export const CourseModal: React.FC<CourseModalProps> = ({
  course,
  onClose,
  onToggleLesson,
  onAskAiAboutCourse,
}) => {
  if (!course) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0A0D0C]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-[#151A18] text-[#F5F7F6] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#29312C] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#101412] border-b border-[#29312C] flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#1B211E] text-[#32D6B0] border border-[#29312C]">
                {course.category}
              </span>
              <span className="text-xs text-[#A3ADA7] flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#32D6B0]" />
                {course.instructor || course.trainerName || 'Lead Instructor'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#F5F7F6] font-['Outfit']">
              {course.title}
            </h2>
            <p className="text-xs text-[#A3ADA7] leading-relaxed max-w-xl">
              {course.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A3ADA7] hover:text-[#F5F7F6] hover:bg-[#1B211E] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Overview Bar */}
        <div className="px-5 sm:px-6 py-3 bg-[#151A18] border-b border-[#29312C] flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex justify-between items-center text-xs font-semibold text-[#F5F7F6] mb-1">
              <span>Syllabus Completion</span>
              <span className="text-[#32D6B0] font-bold">{course.progress}%</span>
            </div>
            <div className="w-full bg-[#1B211E] h-1.5 rounded-full overflow-hidden border border-[#29312C]">
              <div
                className="gradient-uniconnect h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
          {onAskAiAboutCourse && (
            <button
              onClick={() => onAskAiAboutCourse(course.title, course.nextTopic)}
              className="px-3 py-1.5 bg-[#1B211E] hover:bg-[#202724] text-[#32D6B0] border border-[#29312C] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Bot className="w-3.5 h-3.5 text-[#32D6B0]" />
              <span>Ask AI Tutor</span>
            </button>
          )}
        </div>

        {/* Lessons List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-2.5 bg-[#101412]">
          <h3 className="text-xs font-semibold text-[#A3ADA7] uppercase tracking-wider mb-2 font-['Outfit']">
            Curriculum Lessons ({course.lessons.length})
          </h3>
          {course.lessons.map((lesson, idx) => (
            <div
              key={lesson.id}
              onClick={() => onToggleLesson(course.Course_ID || course.id || '', lesson.id)}
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                lesson.completed
                  ? 'bg-[#151A18] border-[#78D98A]/40 text-[#78D98A]'
                  : 'bg-[#151A18] border-[#29312C] text-[#F5F7F6] hover:border-[#32D6B0]/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label={lesson.completed ? 'Mark lesson incomplete' : 'Mark lesson complete'}
                  className="shrink-0"
                >
                  {lesson.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-[#78D98A]" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#29312C]" />
                  )}
                </button>
                <div>
                  <p className={`text-xs sm:text-sm font-semibold ${lesson.completed ? 'line-through text-[#A3ADA7]' : 'text-[#F5F7F6]'}`}>
                    {idx + 1}. {lesson.title}
                  </p>
                  <p className="text-[11px] text-[#A3ADA7] flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-[#A3ADA7]" />
                    {lesson.duration || '20 mins'}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                lesson.completed ? 'bg-[#1B211E] text-[#78D98A] border-[#78D98A]/30' : 'bg-[#1B211E] text-[#A3ADA7] border-[#29312C]'
              }`}>
                {lesson.completed ? 'Completed' : 'Pending'}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#101412] border-t border-[#29312C] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 gradient-uniconnect hover:opacity-95 text-[#0A0D0C] text-xs font-bold rounded-lg shadow-sm transition-opacity glow-teal-sm cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
