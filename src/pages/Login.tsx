import React, { useState, useEffect } from 'react';
import { useRouter, Link } from '../context/RouterContext';
import { authService } from '../services/authService';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
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
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    // Non-blocking simulated response
                  }}
                  className="text-xs font-medium text-[#32D6B0] hover:underline"
                >
                  Forgot password?
                </a>
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
    </div>
  );
};
