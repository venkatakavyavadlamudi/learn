import React from 'react';
import { Filter, X, Calendar, Layers } from 'lucide-react';

export type TimeRange = '7d' | '30d' | 'semester' | 'all';

interface FilterOption {
  label: string;
  value: string;
}

interface DashboardFilterBarProps {
  timeRange?: TimeRange;
  onTimeRangeChange?: (tr: TimeRange) => void;
  dateRange?: string;
  onDateRangeChange?: (tr: any) => void;
  selectedCourse?: string;
  onCourseChange?: (courseId: string) => void;
  coursesList?: FilterOption[];
  availableCourses?: Array<{ id: string; title: string }>;
  statusFilter?: string;
  onStatusChange?: (status: string) => void;
  statusOptions?: FilterOption[];
  onClearFilters?: () => void;
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
}

export const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
  timeRange,
  onTimeRangeChange,
  dateRange,
  onDateRangeChange,
  selectedCourse = 'all',
  onCourseChange,
  coursesList,
  availableCourses,
  statusFilter = 'all',
  onStatusChange,
  statusOptions = [],
  onClearFilters,
  onResetFilters,
  hasActiveFilters = false,
}) => {
  const effectiveTimeRange = (timeRange || dateRange || '30d') as TimeRange;
  const effectiveTimeChange = onTimeRangeChange || onDateRangeChange || (() => {});
  const effectiveClearFilters = onClearFilters || onResetFilters || (() => {});

  const effectiveCourses: FilterOption[] = coursesList
    ? coursesList
    : availableCourses
    ? availableCourses.map((c) => ({ label: c.title, value: c.id }))
    : [];

  const timeRanges: Array<{ label: string; value: TimeRange }> = [
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'This Semester', value: 'semester' },
    { label: 'All Time', value: 'all' },
  ];

  return (
    <div className="bg-[#151A18] border border-[#29312C] rounded-2xl p-3 sm:px-4 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1.5 text-[#A3ADA7] text-xs font-semibold uppercase tracking-wider pr-2 border-r border-[#29312C] hidden sm:flex">
          <Filter className="w-3.5 h-3.5 text-[#32D6B0]" />
          <span>Filters</span>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 bg-[#0A0D0C] p-1 rounded-xl border border-[#29312C]">
          {timeRanges.map((tr) => (
            <button
              key={tr.value}
              onClick={() => effectiveTimeChange(tr.value)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                effectiveTimeRange === tr.value
                  ? 'bg-[#1B211E] text-[#32D6B0] border border-[#32D6B0]/40 shadow-xs'
                  : 'text-[#A3ADA7] hover:text-[#F5F7F6]'
              }`}
            >
              {tr.label}
            </button>
          ))}
        </div>

        {/* Course Filter Dropdown if provided */}
        {onCourseChange && effectiveCourses.length > 0 && (
          <div className="flex items-center gap-1.5">
            <select
              value={selectedCourse}
              onChange={(e) => onCourseChange(e.target.value)}
              className="px-3 py-1.5 bg-[#0A0D0C] border border-[#29312C] rounded-xl text-xs text-[#F5F7F6] focus:outline-none focus:border-[#32D6B0] cursor-pointer"
            >
              <option value="all">All Enrolled Courses</option>
              {effectiveCourses.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status Filter Dropdown if provided */}
        {onStatusChange && statusOptions.length > 0 && (
          <div className="flex items-center gap-1.5">
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="px-3 py-1.5 bg-[#0A0D0C] border border-[#29312C] rounded-xl text-xs text-[#F5F7F6] focus:outline-none focus:border-[#32D6B0] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Clear Filters Button */}
      {(hasActiveFilters || onResetFilters || onClearFilters) && (
        <button
          onClick={effectiveClearFilters}
          className="flex items-center gap-1.5 text-xs text-[#A3ADA7] hover:text-[#FF7272] transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );
};
