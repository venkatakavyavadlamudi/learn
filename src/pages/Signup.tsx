import React, { useState, useEffect } from 'react';
import { useRouter, Link } from '../context/RouterContext';
import { authService } from '../services/authService';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export const Signup: React.FC = () => {
  const { navigate } = useRouter();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      navigate(authService.getRoleDashboardPath(currentUser.role));
    }
  }, [navigate]);

  // Form Fields per specification: Full Name, Email, Password, Confirm Password
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Submission & Validation States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'Empty', color: 'bg-[#29312C]' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score++;

    if (score === 1) return { score: 1, label: 'Weak', color: 'bg-[#FF7272]' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-[#F2D64B]' };
    return { score: 3, label: 'Strong', color: 'bg-[#32D6B0]' };
  };

  const strength = getPasswordStrength(password);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Enter a valid email address';
      } else if (authService.isEmailRegistered(email.trim())) {
        newErrors.email = 'This email has already been registered.';
      }
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      // Connect to Supabase Auth with automatic Student role enforcement
      const result = await authService.registerUser({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });

      if (!result.success || !result.user) {
        setServerError(result.error || 'Failed to complete registration.');
        setIsLoading(false);
        return;
      }

      // Mandatory: Public signup is always assigned the Student role and routed to Student Dashboard
      const welcomeMsg = 'Welcome, Student!';
      const targetDashboard = '/student/dashboard';

      // Persist welcome message and registration status in session
      try {
        sessionStorage.setItem('welcome_message', welcomeMsg);
        sessionStorage.setItem('justRegisteredRole', 'Student');
      } catch {
        // Ignore session storage errors
      }

      setSuccessMessage(welcomeMsg);
      setIsLoading(false);

      // Redirect user directly to the Student Dashboard
      setTimeout(() => {
        navigate(targetDashboard);
      }, 400);
    } catch {
      setServerError('An unexpected error occurred during signup. Please try again.');
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
          Create Your Account
        </h1>
        <p className="mt-1.5 text-center text-xs sm:text-sm text-[#A3ADA7]">
          Start your personalized AI learning journey today
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#151A18] py-8 px-6 sm:px-8 rounded-2xl border border-[#29312C] shadow-2xl">
          {/* Welcome Message Banner upon signup */}
          {successMessage && (
            <div className="mb-5 p-4 rounded-xl bg-[#1B211E] border border-[#32D6B0]/50 flex items-center gap-3 text-sm text-[#32D6B0] animate-in fade-in duration-200 glow-teal-sm">
              <div className="w-8 h-8 rounded-lg gradient-uniconnect text-[#0A0D0C] flex items-center justify-center font-bold shrink-0">
                {successMessage.includes('Super Admin') ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="font-bold text-sm text-[#32D6B0]">{successMessage}</p>
                <p className="text-xs text-[#A3ADA7]">Redirecting to your dashboard...</p>
              </div>
            </div>
          )}

          {serverError && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#1B211E] border border-[#FF7272]/50 flex items-start gap-2.5 text-xs text-[#FF7272]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{serverError}</div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-xs font-semibold text-[#F5F7F6] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A3ADA7]">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Kavya Sharma"
                  className={`block w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-[#101412] border rounded-lg text-[#F5F7F6] placeholder:text-[#A3ADA7]/50 focus:outline-none focus:ring-1 focus:ring-[#32D6B0] ${
                    errors.fullName ? 'border-[#FF7272]' : 'border-[#29312C]'
                  }`}
                />
              </div>
              {errors.fullName && <p className="mt-1 text-xs text-[#FF7272]">{errors.fullName}</p>}
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[#F5F7F6] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A3ADA7]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
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

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-[#F5F7F6] mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A3ADA7]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className={`block w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm bg-[#101412] border rounded-lg text-[#F5F7F6] placeholder:text-[#A3ADA7]/50 focus:outline-none focus:ring-1 focus:ring-[#32D6B0] ${
                    errors.password ? 'border-[#FF7272]' : 'border-[#29312C]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#A3ADA7] hover:text-[#F5F7F6]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4 text-[#A3ADA7]" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-[#FF7272]">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-[#F5F7F6] mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A3ADA7]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className={`block w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm bg-[#101412] border rounded-lg text-[#F5F7F6] placeholder:text-[#A3ADA7]/50 focus:outline-none focus:ring-1 focus:ring-[#32D6B0] ${
                    errors.confirmPassword ? 'border-[#FF7272]' : 'border-[#29312C]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#A3ADA7] hover:text-[#F5F7F6]"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4 text-[#A3ADA7]" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-[#FF7272]">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="p-2.5 rounded-lg bg-[#101412] border border-[#29312C] space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#A3ADA7]">Strength:</span>
                  <span className="font-semibold text-[#F5F7F6]">{strength.label}</span>
                </div>
                <div className="h-1.5 w-full bg-[#1B211E] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${(strength.score / 3) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Sign Up Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold text-[#0A0D0C] gradient-uniconnect hover:opacity-95 focus:outline-none disabled:opacity-50 transition-opacity shadow-md glow-teal-sm cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#0A0D0C]" />
                    <span>Signing Up...</span>
                  </>
                ) : (
                  <span>Sign Up</span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-5 text-center">
            <p className="text-xs text-[#A3ADA7]">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-[#32D6B0] hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
