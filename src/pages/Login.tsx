import React, { useState, useEffect } from 'react';
import { useRouter, Link } from '../context/RouterContext';
import { authService, DEMO_CONFIG } from '../services/authService';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  GraduationCap,
  Users,
  Compass,
  Sparkles,
} from 'lucide-react';

export const Login: React.FC = () => {
  const { navigate } = useRouter();
  const [, setHasAdmin] = useState<boolean>(true);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      navigate(authService.getRoleDashboardPath(user.role));
      return;
    }

    authService.getAdminStatus().then((status) => {
      setHasAdmin(status.hasAdmin);
    });
  }, [navigate]);

  // Login form ONLY asks Email and Password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<'student' | 'trainer' | 'mentor' | null>(null);
  const [view, setView] = useState<'login' | 'forgot-password'>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resetCooldown > 0) {
      timer = setTimeout(() => setResetCooldown(resetCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resetCooldown]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setResendNotice(null);

    if (resetCooldown > 0) {
      setServerError(`Please wait ${resetCooldown} seconds before requesting another reset link.`);
      return;
    }

    if (!resetEmail.trim()) {
      setErrors({ resetEmail: 'Email is required' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail.trim())) {
      setErrors({ resetEmail: 'Enter a valid email address' });
      return;
    }

    setResetLoading(true);
    try {
      const res = await authService.resetPasswordForEmail(resetEmail.trim());
      if (res.success) {
        setResendNotice('If an account exists for this email, you will receive a password reset link. Please check your inbox and spam folder.');
        setResetEmail('');
        setResetCooldown(60); // Start 60s cooldown on success
      } else {
        if (res.error?.toLowerCase().includes('rate limit exceeded') || res.error?.includes('429')) {
          setServerError('Email rate limit exceeded. Please wait 60 seconds before trying again.');
          setResetCooldown(60);
        } else {
          setServerError(res.error || 'Failed to send reset link.');
        }
      }
    } catch (err: any) {
      if (err.status === 429 || err.message?.toLowerCase().includes('rate limit exceeded')) {
        setServerError('Email rate limit exceeded. Please wait 60 seconds before trying again.');
        setResetCooldown(60);
      } else {
        setServerError(err.message || 'An error occurred. Please try again.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'student' | 'trainer' | 'mentor') => {
    setServerError(null);
    setDemoLoading(role);

    try {
      const res = await authService.loginDemoAccount(role);

      if (!res.success || !res.user) {
        setServerError(
          res.error || `Failed to authenticate demo account for ${role}. Please check Supabase configuration.`
        );
        setDemoLoading(null);
        return;
      }

      const route = authService.getRoleDashboardPath(res.user.role);
      navigate(route);
    } catch (err: any) {
      setServerError(
        err?.message || `An error occurred while signing in as ${role}.`
      );
      setDemoLoading(null);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email.trim()) return;
    setIsResending(true);
    setResendNotice(null);
    try {
      const res = await authService.resendConfirmationEmail(email.trim());
      if (res.success) {
        setResendNotice(res.message || 'Confirmation email sent! Please check your inbox.');
      } else {
        setResendNotice(res.error || 'Failed to resend confirmation email.');
      }
    } catch {
      setResendNotice('Failed to resend confirmation email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Enter a valid email address';
      }
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsLoading(true);

    try {
      const result = await authService.login(email.trim(), password);

      if (!result.success || !result.user) {
        setServerError(result.error || 'Authentication failed. Please verify credentials.');
        setIsLoading(false);
        return;
      }

      navigate(authService.getRoleDashboardPath(result.user.role));
    } catch {
      setServerError('An unexpected error occurred during login. Please try again.');
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0A0D0C] bg-grid-pattern flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl gradient-uniconnect text-[#0A0D0C] flex items-center justify-center font-bold shadow-md glow-teal-sm">
              <svg
                className="w-5 h-5 text-[#0A0D0C]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <span className="text-xl font-bold text-[#F5F7F6] font-['Outfit']">LearnAI</span>
          </Link>
        </div>

        <h1 className="mt-4 text-center text-2xl font-bold tracking-tight text-[#F5F7F6] font-['Outfit']">
          Welcome back
        </h1>
        <p className="mt-1.5 text-center text-xs sm:text-sm text-[#A3ADA7]">
          Log in to your AI learning &amp; career dashboard
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#151A18] py-8 px-6 sm:px-8 rounded-2xl border border-[#29312C] shadow-2xl">
          {serverError && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#1B211E] border border-[#FF7272]/50 space-y-2 text-xs text-[#FF7272]">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{serverError}</div>
              </div>
              {serverError.toLowerCase().includes('not been confirmed') && (
                <div className="pt-2 border-t border-[#FF7272]/20 flex items-center justify-between">
                  <span className="text-[11px] text-[#A3ADA7]">Didn't receive the email?</span>
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={isResending}
                    className="text-xs text-[#32D6B0] hover:underline font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {isResending ? 'Sending link...' : 'Resend confirmation link'}
                  </button>
                </div>
              )}
            </div>
          )}

          {resendNotice && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#1B211E] border border-[#32D6B0]/50 text-xs text-[#32D6B0] font-medium">
              {resendNotice}
            </div>
          )}

          {view === 'forgot-password' ? (
            <form className="space-y-4" onSubmit={handleForgotPassword} noValidate>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-[#F5F7F6]">Reset Password</h2>
                <p className="text-[11px] text-[#A3ADA7]">Enter your email address and we'll send you a link to reset your password.</p>
              </div>

              <div>
                <label htmlFor="resetEmail" className="block text-xs font-semibold text-[#F5F7F6] mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A3ADA7]">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="resetEmail"
                    name="resetEmail"
                    type="email"
                    autoComplete="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={`block w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-[#101412] border rounded-lg text-[#F5F7F6] placeholder:text-[#A3ADA7]/50 focus:outline-none focus:ring-1 focus:ring-[#32D6B0] ${
                      errors.resetEmail ? 'border-[#FF7272]' : 'border-[#29312C]'
                    }`}
                  />
                </div>
                {errors.resetEmail && <p className="mt-1 text-xs text-[#FF7272]">{errors.resetEmail}</p>}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={resetLoading || resetCooldown > 0}
                  className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold text-[#0A0D0C] gradient-uniconnect hover:opacity-95 focus:outline-none disabled:opacity-50 transition-opacity shadow-md glow-teal-sm cursor-pointer"
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#0A0D0C]" />
                      <span>Sending link...</span>
                    </>
                  ) : resetCooldown > 0 ? (
                    <span>Wait {resetCooldown}s</span>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setServerError(null);
                  setResendNotice(null);
                }}
                className="w-full text-center text-xs text-[#A3ADA7] hover:text-[#F5F7F6] pt-2"
              >
                Back to Login
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-[#F5F7F6] mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A3ADA7]">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={`block w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-[#101412] border rounded-lg text-[#F5F7F6] placeholder:text-[#A3ADA7]/50 focus:outline-none focus:ring-1 focus:ring-[#32D6B0] ${
                      errors.email ? 'border-[#FF7272]' : 'border-[#29312C]'
                    }`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-[#FF7272]">{errors.email}</p>}
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-xs font-semibold text-[#F5F7F6]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setView('forgot-password')}
                    className="text-xs font-medium text-[#32D6B0] hover:underline cursor-pointer bg-transparent border-none p-0"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A3ADA7]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={`block w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm bg-[#101412] border rounded-lg text-[#F5F7F6] placeholder:text-[#A3ADA7]/50 focus:outline-none focus:ring-1 focus:ring-[#32D6B0] ${
                      errors.password ? 'border-[#FF7272]' : 'border-[#29312C]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#A3ADA7] hover:text-[#F5F7F6]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4 text-[#A3ADA7]" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-[#FF7272]">{errors.password}</p>}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold text-[#0A0D0C] gradient-uniconnect hover:opacity-95 focus:outline-none disabled:opacity-50 transition-opacity shadow-md glow-teal-sm cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#0A0D0C]" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Login</span>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-[#29312C] text-center">
            <p className="text-xs text-[#A3ADA7]">
              Don't have an account?{' '}
              <Link
                href="/signup"
                className="font-semibold text-[#32D6B0] hover:underline"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Modern Quick Demo Accounts Section */}
      {DEMO_CONFIG.enabled && (
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl px-4 sm:px-0">
          <div className="bg-[#151A18] p-6 sm:p-8 rounded-2xl border border-[#29312C] shadow-2xl space-y-6">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#101412] border border-[#29312C] text-xs font-semibold text-[#32D6B0]">
                <Sparkles className="w-3.5 h-3.5 text-[#32D6B0]" />
                <span>Quick Evaluation &amp; Testing</span>
              </div>
              <h2 className="text-lg font-bold text-[#F5F7F6] font-['Outfit'] mt-2">
                Quick Demo Accounts
              </h2>
              <p className="text-xs text-[#A3ADA7]">
                Authenticate with pre-configured test roles to explore student, trainer &amp; mentor telemetry
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 🎓 Student Demo Card */}
              <div className="p-4 rounded-xl bg-[#101412] border border-[#29312C] flex flex-col justify-between space-y-4 hover:border-[#32D6B0]/40 transition-colors">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-[#32D6B0]/10 border border-[#32D6B0]/30 text-[#32D6B0] flex items-center justify-center font-bold">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#F5F7F6] flex items-center gap-1.5">
                      <span>🎓 Student Demo</span>
                    </h3>
                    <p className="text-[11px] text-[#A3ADA7] leading-relaxed mt-1">
                      Explore course modules, practice lab quizzes, assignment submissions, and AI learning roadmap.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('student')}
                  disabled={demoLoading !== null}
                  className="w-full py-2 px-3 bg-[#151A18] hover:bg-[#1B211E] text-[#32D6B0] border border-[#32D6B0]/40 hover:border-[#32D6B0] text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {demoLoading === 'student' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#32D6B0]" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>Login as Student</span>
                  )}
                </button>
              </div>

              {/* 👨‍🏫 Trainer Demo Card */}
              <div className="p-4 rounded-xl bg-[#101412] border border-[#29312C] flex flex-col justify-between space-y-4 hover:border-[#78D98A]/40 transition-colors">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-[#78D98A]/10 border border-[#78D98A]/30 text-[#78D98A] flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#F5F7F6] flex items-center gap-1.5">
                      <span>👨‍🏫 Trainer Demo</span>
                    </h3>
                    <p className="text-[11px] text-[#A3ADA7] leading-relaxed mt-1">
                      Batch curriculum delivery, submission evaluations, rubric code grading, and skill deficits.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('trainer')}
                  disabled={demoLoading !== null}
                  className="w-full py-2 px-3 bg-[#151A18] hover:bg-[#1B211E] text-[#78D98A] border border-[#78D98A]/40 hover:border-[#78D98A] text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {demoLoading === 'trainer' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#78D98A]" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>Login as Trainer</span>
                  )}
                </button>
              </div>

              {/* 🤝 Mentor Demo Card */}
              <div className="p-4 rounded-xl bg-[#101412] border border-[#29312C] flex flex-col justify-between space-y-4 hover:border-[#B4E85A]/40 transition-colors">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-[#B4E85A]/10 border border-[#B4E85A]/30 text-[#B4E85A] flex items-center justify-center font-bold">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#F5F7F6] flex items-center gap-1.5">
                      <span>🤝 Mentor Demo</span>
                    </h3>
                    <p className="text-[11px] text-[#A3ADA7] leading-relaxed mt-1">
                      Assigned mentees, 1-on-1 mentoring sessions, mock interview scoring, and risk telemetry.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('mentor')}
                  disabled={demoLoading !== null}
                  className="w-full py-2 px-3 bg-[#151A18] hover:bg-[#1B211E] text-[#B4E85A] border border-[#B4E85A]/40 hover:border-[#B4E85A] text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {demoLoading === 'mentor' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B4E85A]" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>Login as Mentor</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
