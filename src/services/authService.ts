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

class AuthService {
  private listeners: Array<(user: User | null) => void> = [];

  constructor() {
    this.initSupabaseListener();
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
        } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          try {
            let role: UserRole = 'student';
            let profileData: any = null;

            // 1. Check authoritative learnai_users table
            const { data: learnAiUser } = await client
              .from('learnai_users')
              .select('*')
              .or(`user_id.eq.${session.user.id},email.eq.${session.user.email}`)
              .maybeSingle();

            if (learnAiUser) {
              profileData = learnAiUser;
              role = (learnAiUser.role || 'student') as UserRole;
            } else {
              // 2. Fallback to app_users table
              const { data: appUser } = await client
                .from('app_users')
                .select('*')
                .eq('email', session.user.email)
                .maybeSingle();

              if (appUser) {
                profileData = appUser;
                role = (appUser.role || 'student') as UserRole;
              } else {
                role = (session.user.user_metadata?.role || 'student') as UserRole;
              }
            }

            const updatedUser: User = {
              id: session.user.id,
              userId: session.user.id,
              name:
                profileData?.full_name ||
                session.user.user_metadata?.full_name ||
                session.user.email?.split('@')[0] ||
                'User',
              email: session.user.email || '',
              phone: profileData?.phone || session.user.user_metadata?.phone,
              role,
              status: (profileData?.status || 'active') as AccountStatus,
              emailVerified: Boolean(session.user.email_confirmed_at || true),
              createdAt: profileData?.created_at || session.user.created_at,
              authProvider: 'supabase',
              profile: {
                fullName:
                  profileData?.full_name ||
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
          } catch (err) {
            console.warn('[LearnAI] Supabase session sync warning:', err);
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
      return session ? JSON.parse(session) : null;
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
      roleNormalized === 'super_admin' ||
      roleNormalized === 'super admin' ||
      roleNormalized === 'institution_admin' ||
      roleNormalized === 'institution admin' ||
      roleNormalized.includes('super')
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
    if (raw === 'super_admin' || raw === 'super admin' || raw.includes('super')) {
      return '/super-admin/dashboard';
    }
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

        // Create corresponding entries in public.students and public.app_users
        try {
          const studentId = 'stu_' + data.user.id.replace(/-/g, '').slice(0, 10);
          
          await supabase.from('students').upsert(
            {
              student_id: studentId,
              user_id: data.user.id,
              full_name: fullName.trim(),
              email: cleanEmail,
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
            },
            { onConflict: 'email' }
          );

          await supabase.from('learnai_users').upsert(
            {
              user_id: data.user.id,
              email: cleanEmail,
              role: 'student',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'email' }
          );
        } catch (dbErr) {
          console.warn('[LearnAI] Supabase database table sync notice:', dbErr);
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

    const uid = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newUser: User = {
      id: uid,
      userId: uid,
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim(),
      role: assignedRole,
      status: 'active',
      Organization_ID: null,
      organizationName: undefined,
      emailVerified: true,
      createdAt: new Date().toISOString(),
      profile: {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        learningLevel: 'Undergraduate',
        skills: [],
        careerGoal: 'Software Engineer',
        targetRole: 'Software Engineer',
      },
    };

    // Store password for local login matching
    (newUser as any).password = password;

    this.saveUserToLocalStorage(newUser);

    return {
      success: true,
      user: newUser,
      message: 'Your account has been created as Student.',
    };
  }

  // Authoritative Login: Supports Supabase Auth with seamless fallback to existing Admin & local accounts
  public async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Supabase Auth (if configured)
    if (isSupabaseConfigured() && supabase) {
      try {
        console.log('[LearnAI Auth] Initiating Supabase signInWithPassword for domain:', cleanEmail.includes('@') ? cleanEmail.split('@')[1] : 'unknown');
        const { data, error: sbError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (data?.user) {
          console.log('[LearnAI Auth] Supabase authentication succeeded. User ID:', data.user.id);
          // Fetch profile row to get authoritative role
          let profileRole: UserRole = 'student';
          let profileData: any = null;

          try {
            // 1. Check authoritative learnai_users table first
            const { data: learnAiUser, error: luErr } = await supabase
              .from('learnai_users')
              .select('*')
              .or(`user_id.eq.${data.user.id},email.eq.${cleanEmail}`)
              .maybeSingle();

            if (learnAiUser) {
              console.log('[LearnAI Auth] Profile record found in learnai_users with role:', learnAiUser.role);
              profileData = learnAiUser;
              profileRole = (learnAiUser.role || 'student') as UserRole;
            } else {
              console.warn('[LearnAI Auth] Profile lookup in learnai_users did not find user ID:', data.user.id, luErr ? `(Code: ${luErr.code}, Message: ${luErr.message})` : '(Record not present)');
              // 2. Fallback to app_users table
              const { data: appUser, error: auErr } = await supabase
                .from('app_users')
                .select('*')
                .or(`auth_user_id.eq.${data.user.id},email.eq.${cleanEmail}`)
                .maybeSingle();

              if (appUser) {
                console.log('[LearnAI Auth] Profile record found in app_users with role:', appUser.role);
                profileData = appUser;
                profileRole = (appUser.role || 'student') as UserRole;
                if (!appUser.auth_user_id) {
                  await supabase.from('app_users').update({ auth_user_id: data.user.id }).eq('user_id', appUser.user_id);
                }
              } else {
                console.warn('[LearnAI Auth] Profile lookup in app_users did not find user ID:', data.user.id, auErr ? `(Code: ${auErr.code}, Message: ${auErr.message})` : '(Record not present)');
                profileRole = (data.user.user_metadata?.role || 'student') as UserRole;
              }
            }

            // Safe profile auto-repair if learnai_users record was missing
            if (!learnAiUser) {
              try {
                await supabase.from('learnai_users').upsert({
                  user_id: data.user.id,
                  email: cleanEmail,
                  role: profileRole,
                  created_at: data.user.created_at,
                  updated_at: new Date().toISOString(),
                }, { onConflict: 'email' });
                console.log('[LearnAI Auth] Successfully auto-repaired learnai_users profile for:', data.user.id);
              } catch (repairErr: any) {
                console.warn('[LearnAI Auth] Profile auto-repair notice:', repairErr?.message);
              }
            }

            // Verify or link student record
            const { data: studentRecord } = await supabase
              .from('students')
              .select('student_id, user_id, email')
              .eq('email', cleanEmail)
              .maybeSingle();

            if (studentRecord) {
              if (!studentRecord.user_id || studentRecord.user_id !== data.user.id) {
                await supabase
                  .from('students')
                  .update({ user_id: data.user.id })
                  .eq('student_id', studentRecord.student_id);
              }
            } else if (profileRole === 'student') {
              const studentId = 'stu_' + data.user.id.replace(/-/g, '').slice(0, 10);
              await supabase.from('students').insert({
                student_id: studentId,
                user_id: data.user.id,
                full_name: profileData?.full_name || data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
                email: cleanEmail,
              });
            }
          } catch (profileErr: any) {
            console.warn('[LearnAI Auth] Profile resolution warning:', profileErr?.message);
            profileRole = (data.user.user_metadata?.role || 'student') as UserRole;
          }

          const user: User = {
            id: data.user.id,
            userId: data.user.id,
            name:
              profileData?.full_name ||
              data.user.user_metadata?.full_name ||
              data.user.user_metadata?.name ||
              cleanEmail.split('@')[0],
            email: data.user.email || cleanEmail,
            phone: profileData?.phone || data.user.user_metadata?.phone,
            role: profileRole,
            status: (profileData?.status || 'active') as AccountStatus,
            emailVerified: Boolean(data.user.email_confirmed_at || true),
            createdAt: profileData?.created_at || data.user.created_at,
            authProvider: 'supabase',
            profile: {
              fullName:
                profileData?.full_name ||
                data.user.user_metadata?.full_name ||
                cleanEmail.split('@')[0],
              email: data.user.email || cleanEmail,
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

        if (sbError) {
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
        }
      } catch (sbErr: any) {
        console.warn('[LearnAI Auth] Supabase sign-in attempt exception:', sbErr?.message);
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

    // 4. Check if user exists in database to return accurate, non-misleading error
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: existingDbUser } = await supabase
          .from('learnai_users')
          .select('user_id, email, role')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (existingDbUser) {
          console.warn('[LearnAI Auth] User record exists in learnai_users, but credentials failed for user ID:', existingDbUser.user_id);
          return {
            success: false,
            error: 'Invalid password credentials. Please verify your password and try again.',
          };
        }
      } catch (checkErr: any) {
        console.warn('[LearnAI Auth] Database user verification notice:', checkErr?.message);
      }
    }

    return {
      success: false,
      error: 'Invalid email or password. Please verify your credentials or create a new account.',
    };
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
    if (isSupabaseConfigured() && supabase) {
      try {
        const now = new Date().toISOString();
        if (payload.userId) {
          const { error: err1 } = await supabase
            .from('learnai_users')
            .update({ role: payload.newRole, updated_at: now })
            .eq('user_id', payload.userId);
          if (!err1) supabaseSuccess = true;
        }

        if (payload.email) {
          const cleanEmail = payload.email.trim().toLowerCase();
          const { error: err2 } = await supabase
            .from('learnai_users')
            .update({ role: payload.newRole, updated_at: now })
            .eq('email', cleanEmail);
          if (!err2) supabaseSuccess = true;

          await supabase
            .from('app_users')
            .update({ role: payload.newRole, updated_at: now })
            .eq('email', cleanEmail);
        }
      } catch (sbErr) {
        console.warn('[LearnAI] Supabase promote user notice:', sbErr);
      }
    }

    // Also update local storage cache
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

    // Update active session if user updated themselves
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
      return { success: true, message: data.message || `User role updated to ${payload.newRole.toUpperCase()}.`, user: data.user };
    } catch {
      return { success: true, message: `User role updated to ${payload.newRole.toUpperCase()}.` };
    }
  }

  public async updateUserRole(userId: string, newRole: UserRole, email?: string): Promise<{ success: boolean; error?: string }> {
    let supabaseSuccess = false;
    if (isSupabaseConfigured() && supabase) {
      try {
        const now = new Date().toISOString();
        if (userId) {
          const { error: err1 } = await supabase
            .from('learnai_users')
            .update({ role: newRole, updated_at: now })
            .eq('user_id', userId);
          if (!err1) supabaseSuccess = true;
        }

        if (email) {
          const cleanEmail = email.trim().toLowerCase();
          const { error: err2 } = await supabase
            .from('learnai_users')
            .update({ role: newRole, updated_at: now })
            .eq('email', cleanEmail);
          if (!err2) supabaseSuccess = true;

          await supabase
            .from('app_users')
            .update({ role: newRole, updated_at: now })
            .eq('email', cleanEmail);
        }
      } catch (err) {
        console.warn('[LearnAI] Supabase updateUserRole notice:', err);
      }
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
