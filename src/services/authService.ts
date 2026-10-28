import { User, StudentProfile, UserRole, VerificationCode, PendingRegistration, AccountStatus } from '../types';
import { DEFAULT_PROFILE } from '../data/sampleStudentData';
import { supabase, isSupabaseConfigured, testSupabaseConnection, SupabaseConnectionStatus } from './supabaseClient';

export interface StoredAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  emailVerified: boolean;
  emailVerificationToken?: string;
  verificationStatus?: 'verified' | 'unverified';
  createdAt: string;
  approvedAt?: string;
  profile: any;
}

const STORAGE_KEY_CURRENT_USER = 'learnai_current_session_v3';

export const DEMO_CONFIG = {
  enabled: typeof window !== 'undefined' ? (import.meta.env.VITE_SHOW_DEMO_ACCOUNTS !== 'false') : true,
  accounts: {
    student: {
      email: (typeof window !== 'undefined' && import.meta.env.VITE_DEMO_STUDENT_EMAIL) || 'student.demo@learnpath.com',
      password: (typeof window !== 'undefined' && import.meta.env.VITE_DEMO_STUDENT_PASSWORD) || 'DemoStudent123!',
      name: 'Demo Student',
    },
    trainer: {
      email: (typeof window !== 'undefined' && import.meta.env.VITE_DEMO_TRAINER_EMAIL) || 'trainer.demo@learnpath.com',
      password: (typeof window !== 'undefined' && import.meta.env.VITE_DEMO_TRAINER_PASSWORD) || 'DemoTrainer123!',
      name: 'Demo Trainer',
    },
    mentor: {
      email: (typeof window !== 'undefined' && import.meta.env.VITE_DEMO_MENTOR_EMAIL) || 'mentor.demo@learnpath.com',
      password: (typeof window !== 'undefined' && import.meta.env.VITE_DEMO_MENTOR_PASSWORD) || 'DemoMentor123!',
      name: 'Demo Mentor',
    },
  },
};

class AuthService {
  private listeners: Array<(user: User | null) => void> = [];

  constructor() {
    this.cleanupLegacySessions();
    this.initSupabaseListener();
  }

  private cleanupLegacySessions(): void {
    if (typeof window === 'undefined') return;
    try {
      const session = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (session) {
        const user = JSON.parse(session);
        // If the ID is a legacy usr_ ID, clear the session to force a fresh login
        if (user && user.id && typeof user.id === 'string' && user.id.startsWith('usr_')) {
          console.warn('[LearnAI Auth] Purging legacy usr_ session from localStorage');
          localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
          localStorage.removeItem('currentUser');
          localStorage.removeItem('user');
        }
      }

      // Also clean up the 'users' array which might contain old mock accounts
      const usersRaw = localStorage.getItem('users');
      if (usersRaw) {
        const users = JSON.parse(usersRaw);
        if (Array.isArray(users)) {
          const filtered = users.filter((u: any) => u.id && !u.id.startsWith('usr_'));
          if (filtered.length !== users.length) {
            localStorage.setItem('users', JSON.stringify(filtered));
          }
        }
      }
    } catch (e) {
      console.warn('[LearnAI Auth] Session cleanup failed:', e);
    }
  }

  public async fetchAuthoritativeRole(userId: string, email: string): Promise<UserRole> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Authentication database is not configured. Please contact the administrator.');
    }

    const cleanEmail = email ? email.trim().toLowerCase() : '';
    
    // Safeguard: Do not attempt UUID lookup if the ID is not a valid UUID (e.g. legacy 'usr_' IDs)
    const isLegacyId = typeof userId === 'string' && userId.startsWith('usr_');
    const effectiveUserId = isLegacyId ? null : userId;

    console.log('[LearnAI Auth] [DEBUG] Resolving role. UUID:', effectiveUserId || 'NONE', 'Email:', cleanEmail);

    try {
      // 1. Primary lookup: learnai_users by user_id UUID
      if (effectiveUserId) {
        console.log('[LearnAI Auth] [DEBUG] Querying learnai_users by UUID:', effectiveUserId);
        const { data: uData, error: uErr } = await supabase
          .from('learnai_users')
          .select('user_id, email, role')
          .eq('user_id', effectiveUserId);

        if (uErr) {
          console.error('[LearnAI Auth] [DEBUG] UUID lookup error:', uErr);
          throw new Error(`Database error querying user role by UUID: ${uErr.message}`);
        }

        if (uData && uData.length > 0 && uData[0].role) {
          const resolvedRole = String(uData[0].role).toLowerCase().trim() as UserRole;
          console.log('[LearnAI Auth] Role resolved from learnai_users by UUID:', resolvedRole);

          // Update email if missing
          if (cleanEmail && !uData[0].email) {
            await supabase.from('learnai_users').update({ email: cleanEmail, updated_at: new Date().toISOString() }).eq('user_id', effectiveUserId);
          }
          return resolvedRole;
        }
      }

      // 2. Secondary lookup: learnai_users by email
      if (cleanEmail) {
        console.log('[LearnAI Auth] [DEBUG] Querying learnai_users by email:', cleanEmail);
        const { data: eData, error: eErr } = await supabase
          .from('learnai_users')
          .select('user_id, email, role')
          .ilike('email', cleanEmail);

        if (eErr) {
          console.error('[LearnAI Auth] [DEBUG] Email lookup error:', eErr);
          throw new Error(`Database error querying user role by email: ${eErr.message}`);
        }

        if (eData && eData.length > 0 && eData[0].role) {
          const dbUserId = eData[0].user_id;
          
          // STRICT CHECK: If a UUID exists in the DB for this email, it MUST match the current session UUID.
          if (effectiveUserId && dbUserId && dbUserId !== effectiveUserId) {
            console.error('[LearnAI Auth] UUID mismatch detected for email:', cleanEmail, 'DB UUID:', dbUserId, 'Session UUID:', effectiveUserId);
            throw new Error('Authentication session mismatch: Your account ID does not match our records. Please contact support.');
          }

          const resolvedRole = String(eData[0].role).toLowerCase().trim() as UserRole;
          
          // Link UUID if missing in DB
          if (effectiveUserId && !dbUserId) {
            console.log('[LearnAI Auth] Linking UUID to existing email record:', effectiveUserId);
            await supabase.from('learnai_users').update({ user_id: effectiveUserId, updated_at: new Date().toISOString() }).eq('email', cleanEmail);
          }
          
          console.log('[LearnAI Auth] Role resolved from learnai_users by email:', resolvedRole);
          return resolvedRole;
        }
      }

      // 3. User not found
      console.warn('[LearnAI Auth] [DEBUG] User NOT found in learnai_users:', cleanEmail || effectiveUserId);
      
      // If we are authenticated but have no role record, we should allow recovery
      if (effectiveUserId) {
        throw new Error('Your account profile was not found. Please click "Complete Registration" to finalize your setup.');
      }
      
      throw new Error('Your account was not found in our records. Please contact the administrator.');
    } catch (err: any) {
      console.error('[LearnAI Auth] fetchAuthoritativeRole exception:', err?.message || err);
      throw err;
    }
  }

  /**
   * Password Reset Flow: Step 1 - Send reset email
   */
  public async resetPasswordForEmail(email: string): Promise<{ success: boolean; error?: string; message?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Authentication service not configured.' };
    }
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return { 
        success: true, 
        message: 'Password reset link has been sent to your email. Please check your inbox.' 
      };
    } catch (err: any) {
      console.error('[LearnAI Auth] Reset password error:', err);
      return { success: false, error: err.message || 'Failed to send reset link.' };
    }
  }

  /**
   * Password Reset Flow: Step 2 - Update password with new one
   */
  public async updatePassword(password: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Authentication service not configured.' };
    }
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('[LearnAI Auth] Update password error:', err);
      return { success: false, error: err.message || 'Failed to update password.' };
    }
  }

  /**
   * RECOVERY MECHANISM: Completes a partial registration by creating missing authoritative records.
   * Can be called by the user if their profile is missing during dashboard initialization.
   */
  public async completeRegistration(): Promise<UserRole> {
    if (!isSupabaseConfigured() || !supabase) throw new Error('Supabase not configured');
    
    const { data: { user: sbUser } } = await supabase.auth.getUser();
    if (!sbUser) throw new Error('No authenticated session found. Please log in.');
    
    const email = sbUser.email || '';
    const userId = sbUser.id;
    
    console.log('[LearnAI Auth] Executing completeRegistration for:', email);
    
    // 1. Authoritative Role Record
    const now = new Date().toISOString();
    const { error: roleErr } = await supabase.from('learnai_users').upsert(
      {
        user_id: userId,
        email: email.toLowerCase().trim(),
        role: 'student', // Default role for self-service recovery
        created_at: now,
        updated_at: now,
      },
      { onConflict: 'email' }
    );

    if (roleErr) {
      throw new Error(`Failed to finalize profile: ${roleErr.message}`);
    }

    // 2. Metadata sync
    try {
      const studentId = 'stu_' + userId.replace(/-/g, '').slice(0, 10);
      const fullName = sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || email.split('@')[0];
      
      await supabase.from('students').upsert({
        student_id: studentId,
        user_id: userId,
        full_name: fullName,
        email: email.toLowerCase().trim(),
        created_at: now,
        updated_at: now,
      }, { onConflict: 'student_id' });

      await supabase.from('app_users').upsert({
        user_id: studentId,
        email: email.toLowerCase().trim(),
        full_name: fullName,
        role: 'student',
        status: 'active',
        auth_user_id: userId,
        created_at: now,
        updated_at: now,
      }, { onConflict: 'email' });
    } catch (metaErr) {
      console.warn('[LearnAI Auth] Metadata sync notice during recovery:', metaErr);
    }

    return 'student';
  }

  private initSupabaseListener(): void {
    if (typeof window === 'undefined' || !isSupabaseConfigured()) return;
    const client = supabase;
    if (!client) return;

    try {
      client.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          const current = this.getCurrentUser();
          if (current?.authProvider === 'supabase') {
            localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
            localStorage.removeItem('currentUser');
            this.notify(null);
          }
        } else if (event === 'PASSWORD_RECOVERY') {
          console.log('[LearnAI Auth] Password recovery flow detected. Staying on reset page.');
          // Do nothing, let the ResetPassword page handle the update
        } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          try {
            console.log('[LearnAI Auth] [DEBUG] Role resolution started for:', session.user.id);
            const role = await this.fetchAuthoritativeRole(session.user.id, session.user.email || '');
            console.log('[LearnAI Auth] [DEBUG] Role resolved:', role);
            
            const dashboardRoute = this.getRoleDashboardPath(role);
            console.log('[LearnAI Auth] [DEBUG] Selected Route:', dashboardRoute);

            // Fetch app user record for metadata
            let userRecord: any = null;
            if (session.user.email) {
              const { data: appData } = await client
                .from('app_users')
                .select('*')
                .eq('email', session.user.email.trim().toLowerCase())
                .limit(1);
              if (appData && appData.length > 0) userRecord = appData[0];
            }

            const updatedUser: User = {
              id: session.user.id,
              userId: session.user.id,
              name:
                userRecord?.full_name ||
                session.user.user_metadata?.full_name ||
                session.user.email?.split('@')[0] ||
                'User',
              email: session.user.email || '',
              phone: userRecord?.phone || session.user.user_metadata?.phone,
              role,
              status: (userRecord?.status || 'active') as AccountStatus,
              emailVerified: Boolean(session.user.email_confirmed_at || true),
              createdAt: userRecord?.created_at || session.user.created_at,
              authProvider: 'supabase',
              profile: {
                fullName:
                  userRecord?.full_name ||
                  session.user.user_metadata?.full_name ||
                  session.user.email?.split('@')[0] ||
                  'User',
                email: session.user.email || '',
                learningLevel: 'Undergraduate',
                skills: [],
                careerGoal: 'Software Engineer',
                targetRole: 'Software Engineer',
              },
            };

            localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(updatedUser));
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            this.notify(updatedUser);
            
            // Note: Dashboard routing should be handled by the UI based on the updated user state,
            // not by a direct redirect here unless necessary.
            
          } catch (err) {
            console.error('[LearnAI Auth] Critical role resolution failure:', err);
            // DO NOT silently continue. The user's role is unknown.
            // Sign out to prevent unauthorized access or inconsistent state.
            await this.logout();
            alert('Authentication error: Unable to resolve your account role. Please contact support.');
          }
        }
      });
    } catch (e) {
      console.warn('[LearnAI] Supabase listener initialization notice:', e);
    }
  }

  public async getSupabaseStatus(): Promise<SupabaseConnectionStatus> {
    return testSupabaseConnection();
  }

  public isSupabaseConnected(): boolean {
    return isSupabaseConfigured() && supabase !== null;
  }

  public subscribe(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notify(user: User | null) {
    this.listeners.forEach((cb) => cb(user));
  }

  public getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    try {
      const session = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (!session) return null;
      
      const user = JSON.parse(session);
      // Validate the user object. If it has a legacy ID, ignore it.
      if (user && user.id && typeof user.id === 'string' && user.id.startsWith('usr_')) {
        return null;
      }
      
      return user;
    } catch {
      return null;
    }
  }

  public isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  // --- ACCESS GATEKEEPER ---
  // THE FRONTEND MUST NEVER BE THE SOURCE OF TRUTH FOR USER ROLE.
  // Only after ALL required checks pass should the user receive dashboard access.
  public checkAccessGate(user?: User | null): {
    allowed: boolean;
    reason?: 'unauthenticated' | 'email_unverified' | 'pending_approval' | 'rejected' | 'suspended';
    message?: string;
  } {
    const targetUser = user || this.getCurrentUser();
    if (!targetUser) {
      return { allowed: false, reason: 'unauthenticated', message: 'You must log in to access this area.' };
    }

    if (targetUser.status === 'suspended') {
      return {
        allowed: false,
        reason: 'suspended',
        message: 'Your account has been suspended by an administrator. Please contact support.',
      };
    }

    const roleNormalized = String(targetUser.role || '').toLowerCase();
    if (
      roleNormalized === 'admin' ||
      roleNormalized === 'institution_admin' ||
      roleNormalized === 'institution admin'
    ) {
      return { allowed: true };
    }

    // 1. Email Verification Check
    if (!targetUser.emailVerified && targetUser.emailVerified !== undefined) {
      return {
        allowed: false,
        reason: 'email_unverified',
        message: 'Email verification required. Please verify your email before accessing the portal.',
      };
    }

    // 2. Admin Approval Check
    const statusNormalized = String(targetUser.status || 'active').toLowerCase();
    if (statusNormalized === 'pending') {
      return {
        allowed: false,
        reason: 'pending_approval',
        message: 'Your registration is pending administrator review and approval.',
      };
    }

    if (statusNormalized === 'rejected') {
      return {
        allowed: false,
        reason: 'rejected',
        message: 'Your registration application was not approved by the administrator.',
      };
    }

    return { allowed: statusNormalized === 'approved' || statusNormalized === 'active' };
  }

  public getRoleDashboardPath(role?: UserRole | string): string {
    const raw = String(role || this.getCurrentUser()?.role || 'student').toLowerCase();
    if (raw === 'institution_admin' || raw === 'institution admin' || raw === 'admin') {
      return '/admin';
    }
    if (raw === 'trainer') {
      return '/trainer';
    }
    if (raw === 'mentor') {
      return '/mentor';
    }
    return '/student/dashboard';
  }

  // --- AUTHENTICATION APIS (Calling Secure Backend) ---

  // --- FIRST ADMIN BOOTSTRAP APIS ---
  public async getAdminStatus(): Promise<{ hasAdmin: boolean; adminCount: number }> {
    try {
      const res = await fetch('/api/auth/admin-status');
      if (!res.ok) return { hasAdmin: false, adminCount: 0 };
      const data = await res.json();
      return {
        hasAdmin: Boolean(data.hasAdmin),
        adminCount: Number(data.adminCount) || 0,
      };
    } catch {
      return { hasAdmin: false, adminCount: 0 };
    }
  }

  // One-time First Admin Setup (Section 1, 2, 3)
  public async setupFirstAdmin(data: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }): Promise<{ success: boolean; user?: User; error?: string; message?: string }> {
    try {
      const res = await fetch('/api/auth/setup-first-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error || 'Administrator setup failed.' };
      }

      const user: User = {
        id: json.user.userId,
        name: json.user.name,
        email: json.user.email,
        role: 'admin',
        status: 'active',
        emailVerified: true,
        createdAt: json.user.createdAt,
        profile: json.user.profile,
      };

      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
      this.notify(user);

      return {
        success: true,
        user,
        message: json.message || 'Admin account created successfully.',
      };
    } catch {
      return { success: false, error: 'Network error connecting to setup service.' };
    }
  }

  // --- LOCALSTORAGE STORAGE HELPERS (PURE CLIENT-SIDE COMPATIBILITY) ---
  public getLocalStorageUsers(): any[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('users') || localStorage.getItem('learnai_users');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public hasSuperAdminInLocalStorage(): boolean {
    if (typeof window === 'undefined') return false;
    if (
      localStorage.getItem('hasSuperAdmin') === 'true' ||
      localStorage.getItem('superAdminRegistered') === 'true'
    ) {
      return true;
    }
    const users = this.getLocalStorageUsers();
    return users.some((u: any) => {
      const r = String(u.role || '').toLowerCase();
      return r === 'super admin' || r === 'super_admin' || r.includes('super');
    });
  }

  public isEmailRegistered(email: string): boolean {
    if (!email) return false;
    const users = this.getLocalStorageUsers();
    const normalized = email.trim().toLowerCase();
    return users.some((u: any) => u.email && u.email.trim().toLowerCase() === normalized);
  }

  public saveUserToLocalStorage(user: any): void {
    if (typeof window === 'undefined') return;
    const users = this.getLocalStorageUsers();
    const filtered = users.filter(
      (u: any) =>
        u.id !== user.id &&
        u.email?.trim().toLowerCase() !== user.email?.trim().toLowerCase()
    );
    const updatedUsers = [...filtered, user];
    try {
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      localStorage.setItem('learnai_users', JSON.stringify(updatedUsers));
      localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));
    } catch (e) {
      console.warn('Failed to persist users to localStorage', e);
    }

    const roleStr = String(user.role || '').toLowerCase();
    if (roleStr === 'super admin' || roleStr === 'super_admin' || roleStr.includes('super')) {
      localStorage.setItem('hasSuperAdmin', 'true');
      localStorage.setItem('superAdminRegistered', 'true');
    }

    try {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('user', JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to persist current session to localStorage', e);
    }
    this.notify(user);
  }

  // Public User Signup (Authoritative: always assigns Student role)
  public async registerUser(params: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ success: boolean; user?: User; error?: string; message?: string }> {
    const { fullName, email, password, phone } = params;
    const cleanEmail = email.trim().toLowerCase();

    // 1. If Supabase is configured, use Supabase Auth
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              name: fullName.trim(),
              role: 'student', // Mandatory: public registration is ALWAYS Student
              phone: phone?.trim() || null,
            },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (!data?.user) {
          return { success: false, error: 'Registration failed. No user returned from authentication service.' };
        }

        // Create corresponding entries in public.learnai_users (AUTHORITATIVE), students, and app_users
        try {
          const now = new Date().toISOString();
          // 1. Authoritative Role Record
          const { error: roleErr } = await supabase.from('learnai_users').upsert(
            {
              user_id: data.user.id,
              email: cleanEmail,
              role: 'student',
              created_at: now,
              updated_at: now,
            },
            { onConflict: 'email' }
          );

          if (roleErr) {
             console.error('[LearnAI Auth] Role record creation failed:', roleErr);
             throw new Error(`Account created, but role assignment failed: ${roleErr.message}. Please try logging in to complete setup.`);
          }

          // 2. Secondary Records (Students & App Users for metadata)
          const studentId = 'stu_' + data.user.id.replace(/-/g, '').slice(0, 10);
          
          await supabase.from('students').upsert(
            {
              student_id: studentId,
              user_id: data.user.id,
              full_name: fullName.trim(),
              email: cleanEmail,
              created_at: now,
              updated_at: now,
            },
            { onConflict: 'student_id' }
          );

          await supabase.from('app_users').upsert(
            {
              user_id: studentId,
              email: cleanEmail,
              full_name: fullName.trim(),
              role: 'student',
              status: 'active',
              auth_user_id: data.user.id,
              created_at: now,
              updated_at: now,
            },
            { onConflict: 'email' }
          );

        } catch (dbErr: any) {
          console.error('[LearnAI Auth] Database sync critical failure:', dbErr);
          // If it's already our thrown error, rethrow it.
          if (dbErr.message.includes('role assignment failed')) throw dbErr;
          throw new Error(`Registration partially failed: ${dbErr.message || 'Database sync error'}. Your account was created, but profile setup is incomplete. Please log in.`);
        }

        const newUser: User = {
          id: data.user.id,
          userId: data.user.id,
          name: fullName.trim(),
          email: cleanEmail,
          phone: phone?.trim(),
          role: 'student', // Mandatory: public registration is ALWAYS Student
          status: 'active',
          emailVerified: Boolean(data.user.email_confirmed_at || true),
          createdAt: new Date().toISOString(),
          authProvider: 'supabase',
          profile: {
            fullName: fullName.trim(),
            email: cleanEmail,
            learningLevel: 'Undergraduate',
            skills: [],
            careerGoal: 'Software Engineer',
            targetRole: 'Software Engineer',
          },
        };

        // Also persist to local session & storage
        this.saveUserToLocalStorage(newUser);

        return {
          success: true,
          user: newUser,
          message: 'Your account has been created as Student.',
        };
      } catch (err: any) {
        console.warn('[LearnAI] Supabase signup error, falling back to local storage:', err);
        // If network error, continue to fallback below
      }
    }

    // 2. Local Storage Registration (Mandatory: always assigns Student role)
    return this.registerWithLocalStorage(params);
  }

  public registerWithLocalStorage(params: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  }): { success: boolean; user?: User; error?: string; message?: string } {
    const { fullName, email, password, phone } = params;

    if (this.isEmailRegistered(email)) {
      return { success: false, error: 'This email address has already been registered.' };
    }

    // Mandatory: public signup always assigns the Student role
    const assignedRole: UserRole = 'student';

    // SUPABASE UUID IS MANDATORY. IF NOT PRESENT, THROW ERROR.
    // If we are here in local registration, it means we don't have a valid Supabase UUID.
    // The application should not be creating users without a Supabase UUID in production.
    throw new Error('User registration requires a valid Supabase authentication session.');

  }

  // Authoritative Login: Supports Supabase Auth with seamless fallback to existing Admin & local accounts
  public async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Supabase Auth (if configured)
    if (isSupabaseConfigured() && supabase) {
      let authResult: { data: any; error: any } | null = null;
      try {
        console.log('[LearnAI Auth] Initiating Supabase signInWithPassword for domain:', cleanEmail.includes('@') ? cleanEmail.split('@')[1] : 'unknown');
        authResult = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
      } catch (sbErr: any) {
        console.warn('[LearnAI Auth] Supabase sign-in attempt exception:', sbErr?.message);
      }

      if (authResult?.data?.user) {
        const { user: sbUser } = authResult.data;
        console.log('[LearnAI Auth] Supabase authentication succeeded. User ID:', sbUser.id);
        
        try {
          const profileRole = await this.fetchAuthoritativeRole(sbUser.id, cleanEmail);
          console.log('[LearnAI Diagnostic] 4. Role Held in Application State / Storage (login):', profileRole);
          const dashboardRoute = this.getRoleDashboardPath(profileRole);
          console.log('[LearnAI Diagnostic] 5. Selected Route (login):', dashboardRoute);

          // Fetch profile data for name/phone
          let profileData: any = null;
          try {
            const { data: pr } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', sbUser.id)
              .maybeSingle();
            profileData = pr;
          } catch {}

          try {
            // Verify or link student record
            const { data: studentRecord } = await supabase
              .from('students')
              .select('student_id, user_id, email')
              .eq('email', cleanEmail)
              .maybeSingle();

            if (studentRecord) {
              if (!studentRecord.user_id || studentRecord.user_id !== sbUser.id) {
                await supabase
                  .from('students')
                  .update({ user_id: sbUser.id })
                  .eq('student_id', studentRecord.student_id);
              }
            } else if (profileRole === 'student') {
              const studentId = 'stu_' + sbUser.id.replace(/-/g, '').slice(0, 10);
              await supabase.from('students').insert({
                student_id: studentId,
                user_id: sbUser.id,
                full_name: profileData?.full_name || sbUser.user_metadata?.full_name || cleanEmail.split('@')[0],
                email: cleanEmail,
              });
            }
          } catch (profileErr: any) {
            console.warn('[LearnAI Auth] Profile resolution warning:', profileErr?.message);
          }

          const user: User = {
            id: sbUser.id,
            userId: sbUser.id,
            name:
              profileData?.full_name ||
              sbUser.user_metadata?.full_name ||
              sbUser.user_metadata?.name ||
              cleanEmail.split('@')[0],
            email: sbUser.email || cleanEmail,
            phone: profileData?.phone || sbUser.user_metadata?.phone,
            role: profileRole,
            status: (profileData?.status || 'active') as AccountStatus,
            emailVerified: Boolean(sbUser.email_confirmed_at || true),
            createdAt: profileData?.created_at || sbUser.created_at,
            authProvider: 'supabase',
            profile: {
              fullName:
                profileData?.full_name ||
                sbUser.user_metadata?.full_name ||
                cleanEmail.split('@')[0],
              email: sbUser.email || cleanEmail,
              learningLevel: 'Undergraduate',
              skills: [],
              careerGoal: 'Software Engineer',
              targetRole: 'Software Engineer',
            },
          };

          localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
          localStorage.setItem('currentUser', JSON.stringify(user));
          localStorage.setItem('user', JSON.stringify(user));
          
          // Cleanup: Remove legacy usr_ records from the 'users' array
          const users = this.getLocalStorageUsers();
          const cleanedUsers = users.filter((u: any) => !u.id.startsWith('usr_'));
          localStorage.setItem('users', JSON.stringify(cleanedUsers));

          this.notify(user);

          return { success: true, user };
        } catch (roleErr: any) {
          console.error('[LearnAI Auth] Role resolution failed after successful authentication:', roleErr.message);
          return { success: false, error: roleErr.message };
        }
      }

      if (authResult?.error) {
        const sbError = authResult.error;
        console.warn('[LearnAI Auth] Supabase authentication failed. Status:', sbError.status, 'Code:', (sbError as any).code, 'Message:', sbError.message);

        // If email is unconfirmed, report accurate, actionable error immediately
        if (
          (sbError as any).code === 'email_not_confirmed' ||
          sbError.message?.toLowerCase().includes('email not confirmed')
        ) {
          return {
            success: false,
            error: 'Your email address has not been confirmed yet. Please verify your email via the confirmation link sent to your inbox.',
          };
        }
        
        // If it's a genuine invalid credentials error, we might still want to check local fallbacks
        // especially if we have demo accounts or legacy local-only accounts.
      }
    }

    // 2. Check local accounts (Crucial: Preserves existing logged-in Admin account and test accounts)
    const localUsers = this.getLocalStorageUsers();
    const matched = localUsers.find(
      (u: any) =>
        u.email &&
        u.email.trim().toLowerCase() === cleanEmail &&
        u.password === password
    );

    if (matched) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(matched));
      localStorage.setItem('currentUser', JSON.stringify(matched));
      localStorage.setItem('user', JSON.stringify(matched));
      this.notify(matched);
      return { success: true, user: matched };
    }

    // 3. Fallback to Backend API (/api/auth/login)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        const user: User = {
          id: data.user.userId,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          status: data.user.status,
          Organization_ID: data.user.Organization_ID !== undefined ? data.user.Organization_ID : data.user.profile?.Organization_ID,
          organizationName: data.user.organizationName || data.user.profile?.collegeName || data.user.profile?.organizationName,
          emailVerified: data.user.emailVerified,
          emailVerificationToken: data.user.emailVerificationToken,
          createdAt: data.user.createdAt,
          approvedAt: data.user.approvedAt,
          profile: data.user.profile,
        };

        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('user', JSON.stringify(user));
        this.notify(user);

        return { success: true, user };
      }
    } catch (apiErr: any) {
      console.warn('[LearnAI Auth] Local backend login attempt notice:', apiErr?.message);
    }

    // 4. Final check: If we reach here, and Supabase was checked, provide specific guidance
    if (isSupabaseConfigured() && supabase) {
      // Note: We cannot query learnai_users reliably without authentication due to RLS.
      // Instead, we return a more helpful error that suggests password reset if they are sure the email is right.
      return {
        success: false,
        error: 'Invalid email or password. If you recently migrated your account, you may need to reset your password.',
      };
    }

    return {
      success: false,
      error: 'Invalid email or password. Please verify your credentials or create a new account.',
    };
  }

  // --- DEDICATED QUICK DEMO ACCOUNTS AUTHENTICATION ---
  public async loginDemoAccount(
    role: 'student' | 'trainer' | 'mentor'
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const accountConfig = DEMO_CONFIG.accounts[role];
    if (!accountConfig) {
      return { success: false, error: `No demo account configured for role: ${role}` };
    }

    const email = accountConfig.email.trim().toLowerCase();
    const password = accountConfig.password;

    console.log(`[LearnAI Auth] Attempting demo login for role '${role}' (${email})...`);

    // 1. Primary: Attempt Supabase Auth login
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInData?.user) {
          // Ensure role entry exists in learnai_users
          await supabase.from('learnai_users').upsert(
            {
              user_id: signInData.user.id,
              email,
              role,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'email' }
          );

          const profileRole = await this.fetchAuthoritativeRole(signInData.user.id, email);

          const user: User = {
            id: signInData.user.id,
            userId: signInData.user.id,
            name: accountConfig.name,
            email,
            role: profileRole,
            status: 'active',
            emailVerified: true,
            createdAt: signInData.user.created_at || new Date().toISOString(),
            authProvider: 'supabase',
            profile: {
              fullName: accountConfig.name,
              email,
              learningLevel: 'Undergraduate',
              skills: [],
              careerGoal: 'Software Engineer',
              targetRole: 'Software Engineer',
            },
          };

          localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
          localStorage.setItem('currentUser', JSON.stringify(user));
          localStorage.setItem('user', JSON.stringify(user));
          this.notify(user);

          return { success: true, user };
        }

        // If signIn failed because user does not exist in Supabase Auth yet, attempt auto-signup
        if (signInErr) {
          console.log(`[LearnAI Auth] Demo signIn for ${email} notice: ${signInErr.message}. Attempting auto-provision in Supabase Auth...`);

          const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: accountConfig.name,
                role,
              },
            },
          });

          if (signUpData?.user) {
            // Upsert into learnai_users
            await supabase.from('learnai_users').upsert(
              {
                user_id: signUpData.user.id,
                email,
                role,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'email' }
            );

            await supabase.from('app_users').upsert(
              {
                email,
                role,
                profile_id: signUpData.user.id,
              },
              { onConflict: 'email' }
            );

            if (signUpData.session) {
              const user: User = {
                id: signUpData.user.id,
                userId: signUpData.user.id,
                name: accountConfig.name,
                email,
                role,
                status: 'active',
                emailVerified: true,
                createdAt: signUpData.user.created_at || new Date().toISOString(),
                authProvider: 'supabase',
                profile: { fullName: accountConfig.name, email },
              };

              localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
              localStorage.setItem('currentUser', JSON.stringify(user));
              localStorage.setItem('user', JSON.stringify(user));
              this.notify(user);

              return { success: true, user };
            }

            // Retry sign in once created
            const { data: retryData, error: retryErr } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (retryData?.user) {
              const user: User = {
                id: retryData.user.id,
                userId: retryData.user.id,
                name: accountConfig.name,
                email,
                role,
                status: 'active',
                emailVerified: true,
                createdAt: retryData.user.created_at,
                authProvider: 'supabase',
                profile: { fullName: accountConfig.name, email },
              };
              localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
              localStorage.setItem('currentUser', JSON.stringify(user));
              localStorage.setItem('user', JSON.stringify(user));
              this.notify(user);
              return { success: true, user };
            }

            if (retryErr) {
              return {
                success: false,
                error: `Demo account created for ${email}. If Supabase requires email confirmation, confirm ${email} or disable 'Confirm email' in Supabase Auth settings.`,
              };
            }
          }

          return {
            success: false,
            error: `Unable to authenticate demo account (${email}): ${signUpErr?.message || signInErr.message}. Please configure user '${email}' in Supabase Authentication and assign role '${role}' in learnai_users.`,
          };
        }
      } catch (err: any) {
        console.warn(`[LearnAI Auth] Supabase demo login warning:`, err);
      }
    }

    // Local fallback when Supabase Auth is unavailable
    const fallbackUser: User = {
      id: `demo_${role}_` + Date.now(),
      userId: `demo_${role}_` + Date.now(),
      name: accountConfig.name,
      email,
      role,
      status: 'active',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      profile: {
        fullName: accountConfig.name,
        email,
      },
    };

    this.saveUserToLocalStorage(fallbackUser);
    return { success: true, user: fallbackUser };
  }

  // Resend confirmation email for unconfirmed accounts
  public async resendConfirmationEmail(email: string): Promise<{ success: boolean; error?: string; message?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Authentication service not configured.' };
    }
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return {
        success: true,
        message: 'Confirmation email resent. Please check your inbox and spam folder.',
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to resend confirmation email.' };
    }
  }

  // Secure Registration
  public async register(
    payload: any
  ): Promise<{ success: boolean; user?: User; error?: string; message?: string }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Registration failed.' };
      }

      const user: User = {
        id: data.user.userId,
        name: data.user.name || data.user.profile?.fullName || data.user.email.split('@')[0],
        email: data.user.email,
        role: data.user.role,
        status: data.user.status,
        Organization_ID: data.user.Organization_ID !== undefined ? data.user.Organization_ID : data.user.profile?.Organization_ID,
        organizationName: data.user.organizationName || data.user.profile?.collegeName,
        emailVerified: data.user.emailVerified,
        emailVerificationToken: data.user.emailVerificationToken,
        verificationStatus: data.user.verificationStatus,
        createdAt: new Date().toISOString(),
        profile: data.user.profile,
      };

      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
      this.notify(user);

      return { success: true, user, message: data.message };
    } catch (err: any) {
      return { success: false, error: 'Unable to submit registration to the server.' };
    }
  }

  public async getOrganizations(): Promise<any[]> {
    try {
      const res = await fetch('/api/organizations');
      const data = await res.json();
      const list = data.organizations || [];
      return list.map((org: any, idx: number) => {
        const id = org.Organization_ID || org.id || `org_${idx}`;
        return {
          ...org,
          id,
          Organization_ID: org.Organization_ID || id,
        };
      });
    } catch {
      return [];
    }
  }

  // Email Verification
  public async verifyEmail(
    email: string,
    token?: string
  ): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Email verification failed.' };
      }

      // Update current session user if same email
      const current = this.getCurrentUser();
      if (current && current.email.toLowerCase() === email.toLowerCase()) {
        current.emailVerified = true;
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(current));
        this.notify(current);
      }

      return { success: true, message: data.message };
    } catch {
      return { success: false, error: 'Failed to verify email.' };
    }
  }

  // Pre-validate verification code on backend
  public async validateVerificationCode(
    code: string,
    requestedRole: 'mentor' | 'trainer'
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      const res = await fetch('/api/verification-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, requestedRole }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        return { valid: false, error: data.error || `Invalid ${requestedRole} verification code.` };
      }

      return { valid: true };
    } catch {
      return { valid: false, error: 'Server unreachable for verification code validation.' };
    }
  }

  public async logout(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[LearnAI] Supabase signOut notice:', err);
      }
    }
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('user');
    try {
      sessionStorage.clear();
    } catch {
      // ignore
    }
    this.notify(null);
  }

  // --- ADMIN APIs ---

  private getAdminHeaders(): HeadersInit {
    const current = this.getCurrentUser();
    return {
      'Content-Type': 'application/json',
      'x-admin-email': current?.email || 'admin@learnai.com',
    };
  }

  public async getPendingRegistrations(): Promise<PendingRegistration[]> {
    try {
      const res = await fetch('/api/admin/pending-registrations', {
        headers: this.getAdminHeaders(),
      });
      const data = await res.json();
      return data.pending || [];
    } catch {
      return [];
    }
  }

  public async approveRegistration(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const current = this.getCurrentUser();
      const res = await fetch('/api/admin/approve-registration', {
        method: 'POST',
        headers: this.getAdminHeaders(),
        body: JSON.stringify({ userId, approvedBy: current?.email || 'admin@learnai.com' }),
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Server error approving registration.' };
    }
  }

  public async rejectRegistration(userId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/admin/reject-registration', {
        method: 'POST',
        headers: this.getAdminHeaders(),
        body: JSON.stringify({ userId, reason }),
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Server error rejecting registration.' };
    }
  }

  public async getVerificationCodes(): Promise<VerificationCode[]> {
    try {
      const res = await fetch('/api/admin/verification-codes', {
        headers: this.getAdminHeaders(),
      });
      const data = await res.json();
      return data.codes || [];
    } catch {
      return [];
    }
  }

  public async createVerificationCode(params: {
    role: 'mentor' | 'trainer';
    customCode?: string;
    expiresInDays?: number;
    usageLimit?: number;
    note?: string;
  }): Promise<{ success: boolean; plainCode?: string; error?: string }> {
    try {
      const current = this.getCurrentUser();
      const res = await fetch('/api/admin/verification-codes', {
        method: 'POST',
        headers: this.getAdminHeaders(),
        body: JSON.stringify({ ...params, createdBy: current?.email || 'admin@learnai.com' }),
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Failed to create verification code.' };
    }
  }

  public async revokeVerificationCode(codeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/admin/verification-codes/${codeId}`, {
        method: 'DELETE',
        headers: this.getAdminHeaders(),
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Failed to revoke verification code.' };
    }
  }

  public async regenerateVerificationCode(codeId: string): Promise<{ success: boolean; plainCode?: string; error?: string }> {
    try {
      const res = await fetch(`/api/admin/verification-codes/${codeId}/regenerate`, {
        method: 'POST',
        headers: this.getAdminHeaders(),
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Failed to regenerate code.' };
    }
  }

  public async getAllUsers(organizationId?: string): Promise<any[]> {
    const localUsers = this.getLocalStorageUsers();
    let supabaseUsers: any[] = [];

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: usersData, error } = await supabase.from('learnai_users').select('*');
        if (!error && usersData && usersData.length > 0) {
          supabaseUsers = usersData.map((p: any) => ({
            id: p.user_id || p.id,
            userId: p.user_id || p.id,
            name: p.full_name || (p.email ? p.email.split('@')[0] : 'User'),
            email: p.email,
            phone: p.phone,
            role: (p.role || 'student') as UserRole,
            status: (p.status || 'active') as AccountStatus,
            createdAt: p.created_at,
            authProvider: 'supabase',
            profile: {
              fullName: p.full_name || (p.email ? p.email.split('@')[0] : 'User'),
              email: p.email,
            },
          }));
        } else {
          // Fallback to app_users if learnai_users has no rows
          const { data: appUsers } = await supabase.from('app_users').select('*');
          if (appUsers && appUsers.length > 0) {
            supabaseUsers = appUsers.map((p: any) => ({
              id: p.auth_user_id || p.user_id,
              userId: p.auth_user_id || p.user_id,
              name: p.full_name || (p.email ? p.email.split('@')[0] : 'User'),
              email: p.email,
              phone: p.phone,
              role: (p.role || 'student') as UserRole,
              status: (p.status || 'active') as AccountStatus,
              createdAt: p.created_at,
              authProvider: 'supabase',
              profile: {
                fullName: p.full_name,
                email: p.email,
              },
            }));
          }
        }
      } catch (err) {
        console.warn('[LearnAI] Supabase users query warning:', err);
      }
    }

    try {
      const url = organizationId
        ? `/api/admin/users?organizationId=${encodeURIComponent(organizationId)}`
        : '/api/admin/users';
      const res = await fetch(url, {
        headers: this.getAdminHeaders(),
      });
      const data = await res.json();
      const apiUsers = data.users || [];

      // Merge unique by email/id (Supabase takes precedence, then API, then local)
      const map = new Map<string, any>();
      localUsers.forEach((u) => {
        const key = (u.email || u.id || '').toLowerCase();
        if (key) map.set(key, u);
      });
      apiUsers.forEach((u: any) => {
        const key = (u.email || u.id || '').toLowerCase();
        if (key && !map.has(key)) map.set(key, u);
      });
      supabaseUsers.forEach((u: any) => {
        const key = (u.email || u.id || '').toLowerCase();
        if (key) map.set(key, u);
      });

      return Array.from(map.values());
    } catch {
      const map = new Map<string, any>();
      localUsers.forEach((u) => {
        const key = (u.email || u.id || '').toLowerCase();
        if (key) map.set(key, u);
      });
      supabaseUsers.forEach((u: any) => {
        const key = (u.email || u.id || '').toLowerCase();
        if (key) map.set(key, u);
      });
      return Array.from(map.values());
    }
  }

  public async getRoleHistory(organizationId?: string): Promise<any[]> {
    try {
      const url = organizationId
        ? `/api/admin/role-history?organizationId=${encodeURIComponent(organizationId)}`
        : '/api/admin/role-history';
      const res = await fetch(url, {
        headers: this.getAdminHeaders(),
      });
      const data = await res.json();
      return data.history || [];
    } catch {
      return [];
    }
  }

  public async promoteUser(payload: {
    userId: string;
    newRole: UserRole;
    email?: string;
    reason?: string;
    qualification?: string;
    specialization?: string;
    yearsOfExperience?: number;
    expertise?: string[];
    skills?: string[];
    availability?: string;
    coursesCanTeach?: string[];
    updateOrgId?: string | null;
  }): Promise<{ success: boolean; message?: string; error?: string; user?: any }> {
    let supabaseSuccess = false;
    let lastError = '';

    if (isSupabaseConfigured() && supabase) {
      try {
        const now = new Date().toISOString();
        const cleanRole = String(payload.newRole).toLowerCase().trim();
        const cleanEmail = payload.email ? payload.email.trim().toLowerCase() : '';

        console.log('[LearnAI Diagnostic] promoteUser updating role in Supabase. UserID:', payload.userId, 'Email:', cleanEmail, 'NewRole:', cleanRole);

        // 1. Update app_users catalog table by email
        if (cleanEmail) {
          const { error: errApp } = await supabase
            .from('app_users')
            .update({ role: cleanRole, updated_at: now })
            .eq('email', cleanEmail);
          if (!errApp) supabaseSuccess = true;
          else console.warn('[LearnAI Diagnostic] app_users update notice:', errApp.message);
        }

        // 2. Authoritative Runtime Table: learnai_users (UPSERT to ensure record is created/updated)
        let resolvedUserId = payload.userId;
        if (!resolvedUserId && cleanEmail) {
          const { data: existingUser } = await supabase
            .from('learnai_users')
            .select('user_id')
            .eq('email', cleanEmail)
            .maybeSingle();
          if (existingUser?.user_id) resolvedUserId = existingUser.user_id;
        }

        if (resolvedUserId || cleanEmail) {
          const { error: errLu } = await supabase.from('learnai_users').upsert(
            {
              user_id: resolvedUserId || null,
              email: cleanEmail,
              role: cleanRole,
              updated_at: now,
            },
            { onConflict: 'email' }
          );

          if (!errLu) {
            supabaseSuccess = true;
          } else {
            lastError = errLu.message;
            console.error('[LearnAI Diagnostic] learnai_users upsert error:', errLu.message);
          }
        }

        // 3. Create or update required Trainer or Mentor profile record
        if (cleanRole === 'trainer' && cleanEmail) {
          const trnId = 'TRN_' + Date.now().toString(36).toUpperCase();
          await supabase.from('trainers').upsert(
            {
              trainer_id: trnId,
              user_id: resolvedUserId || null,
              full_name: cleanEmail.split('@')[0],
              email: cleanEmail,
              qualification: payload.qualification || 'Senior Instructor',
              specialization: payload.specialization || 'Full-Stack Development',
              status: 'active',
            },
            { onConflict: 'email' }
          );
        } else if (cleanRole === 'mentor' && cleanEmail) {
          const menId = 'MEN_' + Date.now().toString(36).toUpperCase();
          await supabase.from('mentors').upsert(
            {
              mentor_id: menId,
              user_id: resolvedUserId || null,
              full_name: cleanEmail.split('@')[0],
              email: cleanEmail,
              qualification: payload.qualification || 'Industry Specialist',
              specialization: payload.specialization || 'AI & Mentorship',
              status: 'active',
            },
            { onConflict: 'email' }
          );
        }
      } catch (sbErr: any) {
        lastError = sbErr?.message || 'Database update exception';
        console.warn('[LearnAI Diagnostic] Supabase promote user exception:', sbErr);
      }
    }

    if (isSupabaseConfigured() && !supabaseSuccess) {
      return {
        success: false,
        error: lastError || 'Failed to update user role in Supabase learnai_users table.',
      };
    }

    // Update local storage cache
    const users = this.getLocalStorageUsers();
    const updated = users.map((u: any) => {
      if (
        (payload.userId && (u.id === payload.userId || u.userId === payload.userId)) ||
        (payload.email && u.email && u.email.toLowerCase() === payload.email.toLowerCase())
      ) {
        return { ...u, role: payload.newRole };
      }
      return u;
    });
    localStorage.setItem('users', JSON.stringify(updated));
    localStorage.setItem('learnai_users', JSON.stringify(updated));

    // Update active session if user promoted themselves
    const current = this.getCurrentUser();
    if (
      current &&
      ((payload.userId && (current.id === payload.userId || current.userId === payload.userId)) ||
        (payload.email && current.email && current.email.toLowerCase() === payload.email.toLowerCase()))
    ) {
      current.role = payload.newRole;
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(current));
      this.notify(current);
    }

    try {
      const res = await fetch('/api/admin/promote-user', {
        method: 'POST',
        headers: this.getAdminHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success && !supabaseSuccess) {
        return data;
      }
      return {
        success: true,
        message: data.message || `User role updated to ${payload.newRole.toUpperCase()}.`,
        user: data.user,
      };
    } catch {
      return { success: true, message: `User role updated to ${payload.newRole.toUpperCase()}.` };
    }
  }

  public async updateUserRole(userId: string, newRole: UserRole, email?: string): Promise<{ success: boolean; error?: string }> {
    let supabaseSuccess = false;
    let lastError = '';
    const cleanRole = String(newRole).toLowerCase().trim();
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    if (isSupabaseConfigured() && supabase) {
      try {
        const now = new Date().toISOString();
        if (cleanEmail) {
          const { error: errApp } = await supabase
            .from('app_users')
            .update({ role: cleanRole, updated_at: now })
            .eq('email', cleanEmail);
          if (!errApp) supabaseSuccess = true;

          const { error: errLu } = await supabase.from('learnai_users').upsert(
            {
              user_id: userId || null,
              email: cleanEmail,
              role: cleanRole,
              updated_at: now,
            },
            { onConflict: 'email' }
          );
          if (!errLu) supabaseSuccess = true;
          else lastError = errLu.message;
        } else if (userId) {
          const { error: errLu } = await supabase
            .from('learnai_users')
            .update({ role: cleanRole, updated_at: now })
            .eq('user_id', userId);
          if (!errLu) supabaseSuccess = true;
          else lastError = errLu.message;
        }
      } catch (err: any) {
        lastError = err?.message || 'Role update failed';
        console.warn('[LearnAI Diagnostic] Supabase updateUserRole notice:', err);
      }
    }

    if (isSupabaseConfigured() && !supabaseSuccess) {
      return { success: false, error: lastError || 'Failed to update user role in Supabase.' };
    }

    // Also update local storage cache
    const users = this.getLocalStorageUsers();
    const updated = users.map((u: any) => {
      if (
        (userId && (u.id === userId || u.userId === userId)) ||
        (email && u.email && u.email.toLowerCase() === email.toLowerCase())
      ) {
        return { ...u, role: newRole };
      }
      return u;
    });
    localStorage.setItem('users', JSON.stringify(updated));
    localStorage.setItem('learnai_users', JSON.stringify(updated));

    // Update active session if user updated themselves
    const current = this.getCurrentUser();
    if (
      current &&
      ((userId && (current.id === userId || current.userId === userId)) ||
        (email && current.email && current.email.toLowerCase() === email.toLowerCase()))
    ) {
      current.role = newRole;
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(current));
      this.notify(current);
    }

    try {
      const res = await fetch('/api/admin/users/role', {
        method: 'POST',
        headers: this.getAdminHeaders(),
        body: JSON.stringify({ userId, newRole, email }),
      });
      const data = await res.json();
      return { success: data.success || supabaseSuccess, error: data.error };
    } catch {
      return { success: supabaseSuccess || true };
    }
  }

  public async toggleUserStatus(userId: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: p } = await supabase.from('learnai_users').select('status').eq('user_id', userId).maybeSingle();
        const nextStatus = p?.status === 'active' ? 'suspended' : 'active';
        await supabase.from('learnai_users').update({ status: nextStatus, updated_at: new Date().toISOString() }).eq('user_id', userId);
        await supabase.from('app_users').update({ status: nextStatus }).eq('auth_user_id', userId);
      } catch (err) {
        console.warn('[LearnAI] Supabase toggleUserStatus notice:', err);
      }
    }

    // Also toggle in local storage
    const users = this.getLocalStorageUsers();
    const updated = users.map((u: any) => {
      if (u.id === userId || u.userId === userId) {
        const next = u.status === 'active' ? 'suspended' : 'active';
        return { ...u, status: next };
      }
      return u;
    });
    localStorage.setItem('users', JSON.stringify(updated));

    try {
      const res = await fetch('/api/admin/users/status', {
        method: 'POST',
        headers: this.getAdminHeaders(),
        body: JSON.stringify({ userId }),
      });
      return await res.json();
    } catch {
      return { success: true };
    }
  }

  public async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: this.getAdminHeaders(),
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Failed to delete user.' };
    }
  }

  // Reset database back to first-admin bootstrap state (for development / testing)
  public async resetBootstrap(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/admin/reset-bootstrap', {
        method: 'POST',
        headers: this.getAdminHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Clear local session as admin is wiped
        this.logout();
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || 'Failed to reset platform.' };
    } catch {
      return { success: false, error: 'Network error resetting platform.' };
    }
  }

  // Seed demonstration students, trainers, and mentors
  public async seedDemoData(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/admin/seed-demo-data', {
        method: 'POST',
        headers: this.getAdminHeaders(),
      });
      const data = await res.json();
      return {
        success: Boolean(data.success),
        message: data.message,
        error: data.error,
      };
    } catch {
      return { success: false, error: 'Network error seeding demo data.' };
    }
  }

  public async createInstitutionAdmin(params: {
    name: string;
    email: string;
    phone?: string;
    organizationId?: string;
    password?: string;
  }): Promise<{ success: boolean; error?: string; user?: any }> {
    try {
      const res = await fetch('/api/admin/create-institution-admin', {
        method: 'POST',
        headers: this.getAdminHeaders(),
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Failed to create Institution Admin.' };
    }
  }

  public async createOrganization(params: {
    name: string;
    type?: string;
  }): Promise<{ success: boolean; error?: string; organization?: any }> {
    try {
      const res = await fetch('/api/admin/create-organization', {
        method: 'POST',
        headers: this.getAdminHeaders(),
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Failed to create organization.' };
    }
  }

  // --- Profile Management Helpers ---

  public getProfile(userId: string): StudentProfile {
    const current = this.getCurrentUser();
    if (current && current.id === userId && current.profile) {
      return {
        ...DEFAULT_PROFILE,
        ...current.profile,
        fullName: current.profile.fullName || current.name,
      };
    }
    return DEFAULT_PROFILE;
  }

  public updateProfile(userId: string, updatedFields: Partial<StudentProfile>): boolean {
    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      current.profile = {
        ...current.profile,
        ...updatedFields,
      };
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(current));
      this.notify(current);
      return true;
    }
    return false;
  }

  public updateUserName(userId: string, newName: string): boolean {
    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      current.name = newName;
      if (current.profile) current.profile.fullName = newName;
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(current));
      this.notify(current);
      return true;
    }
    return false;
  }

  public getAllAccounts(): any[] {
    const current = this.getCurrentUser();
    return current ? [current] : [];
  }
}

export const authService = new AuthService();
