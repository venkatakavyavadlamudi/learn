import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Course, StudentProfile, TrainerProfile, MentorProfile } from '../types';

export interface AllocationDetails {
  student_id: string;
  trainer_id?: string;
  mentor_id?: string;
  allocated_by: string;
  notes?: string;
}

class StaffAllocationService {
  /**
   * Assign a trainer and mentor to a student
   */
  public async allocateStaff(details: AllocationDetails): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase is not configured' };
    }

    try {
      const now = new Date().toISOString();

      // 1. Update the student record directly for current mapping
      const { error: studentErr } = await supabase
        .from('students')
        .update({
          trainer_id: details.trainer_id,
          mentor_id: details.mentor_id,
          updated_at: now
        })
        .eq('student_id', details.student_id);

      if (studentErr) throw studentErr;

      // 2. Create an allocation history record
      const { error: historyErr } = await supabase
        .from('student_staff_allocations')
        .insert({
          student_id: details.student_id,
          trainer_id: details.trainer_id,
          mentor_id: details.mentor_id,
          allocated_by: details.allocated_by,
          status: 'active',
          notes: details.notes,
          created_at: now,
          updated_at: now
        });

      // We don't fail the whole operation if history fails, but we log it
      if (historyErr) {
        console.warn('[LearnAI] Failed to record allocation history:', historyErr);
      }

      return { success: true };
    } catch (err: any) {
      console.error('[LearnAI] Allocation error:', err);
      return { success: false, error: err.message || 'Failed to allocate staff' };
    }
  }

  /**
   * Get all courses for the catalogue
   */
  public async getCourseCatalogue(): Promise<Course[]> {
    if (!isSupabaseConfigured() || !supabase) return [];
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*');
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[LearnAI] Error fetching courses:', err);
      return [];
    }
  }

  /**
   * Enroll a student in a course
   */
  public async enrollInCourse(studentId: string, courseId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) return { success: false, error: 'Supabase not configured' };
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          student_id: studentId,
          course_id: courseId,
          status: 'enrolled',
          enrolled_at: new Date().toISOString()
        });

      if (error) {
        if (error.code === '23505') return { success: false, error: 'You are already enrolled in this course' };
        if (error.code === 'PGRST205') return { success: false, error: 'Enrollment service currently unavailable' };
        throw error;
      }
      return { success: true };
    } catch (err: any) {
      if (err?.code !== 'PGRST205') {
        console.error('[LearnAI] Enrollment error:', err);
      }
      return { success: false, error: err.message || 'Failed to enroll in course' };
    }
  }

  /**
   * Get courses a student is enrolled in
   */
  public async getStudentEnrollments(studentId: string): Promise<Course[]> {
    if (!isSupabaseConfigured() || !supabase) return [];
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          courses (*)
        `)
        .eq('student_id', studentId);

      if (error) {
        if (error.code === 'PGRST205') {
          return [];
        }
        throw error;
      }
      return (data || []).map(e => e.courses);
    } catch (err: any) {
      if (err?.code !== 'PGRST205') {
        console.error('[LearnAI] Error fetching student enrollments:', err);
      }
      return [];
    }
  }
}

export const staffAllocationService = new StaffAllocationService();
