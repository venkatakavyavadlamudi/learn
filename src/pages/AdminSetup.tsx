import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { authService } from '../services/authService';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Loader2,
} from 'lucide-react';

export const AdminSetup: React.FC = () => {
  const { navigate } = useRouter();

  // Status check: adminCount and hasAdmin
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [hasAdmin, setHasAdmin] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  // Form inputs
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI helpers
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let countdownInterval: any = null;

    const checkAdminStatus = async () => {
      setCheckingStatus(true);
      const status = await authService.getAdminStatus();
      if (status.hasAdmin) {
        setHasAdmin(true);
        setRedirectCountdown(3);
        let remaining = 3;
        countdownInterval = setInterval(() => {
          remaining -= 1;
          setRedirectCountdown(remaining);
          if (remaining <= 0) {
            clearInterval(countdownInterval);
            navigate('/login');
          }
        }, 1000);
      } else {
        setHasAdmin(false);
      }
      setCheckingStatus(false);
    };

    checkAdminStatus();

    return () => {
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [navigate]);

  const validate = (): boolean => {
    setErrorMessage(null);
    if (!fullName.trim()) {
      setErrorMessage('Full name is required.');
      return false;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Please provide a valid email address.');
      return false;
    }
    if (!password || password.length < 8) {
      setErrorMessage('Password must be at least 8 characters in length.');
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrorMessage(null);

    const result = await authService.setupFirstAdmin({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      confirmPassword,
    });

    setLoading(false);

    if (result.success) {
      setSuccessMessage('First Administrator account provisioned successfully! Redirecting...');
      setTimeout(() => {
        navigate('/admin');
      }, 1200);
    } else {
      setErrorMessage(result.error || 'Failed to setup administrator.');
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#F8FAFC] px-4">
        <div className="flex flex-col items-center gap-3 text-[#64748B]">
          <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
          <span className="text-sm font-medium">Verifying administrator setup status...</span>
        </div>
      </div>
    );
  }

  // LOCKED STATE: If admin already exists
  if (hasAdmin) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 bg-[#F8FAFC]">
        <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center space-y-5 shadow-card">
          <div className="w-14 h-14 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#FEF3C7] text-[#D97706]">
              Setup Locked
            </span>
            <h2 className="text-xl font-bold text-[#0F172A]">
              Administrator setup has already been completed.
            </h2>
            <p className="text-xs text-[#64748B] leading-relaxed">
              The primary system administrator account has already been registered and secured. Additional administrators cannot be created through public setup.
            </p>
          </div>

          <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs text-[#64748B]">
            Redirecting to login in <strong className="text-[#2563EB]">{redirectCountdown ?? 1}s</strong>...
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ACTIVE SETUP SCREEN
  return (
    <div className="min-h-[90vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC]">
      <div className="max-w-xl w-full space-y-6">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
              One-Time System Initialization
            </span>
            <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
          </div>

          <h1 className="text-2xl font-bold text-[#0F172A]">
            Configure Primary Administrator
          </h1>
          <p className="text-xs text-[#64748B] mt-1 mb-6">
            Register the root administrator credential. This account holds platform governance rights.
          </p>

          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-[#FEE2E2] border border-[#FECACA] flex items-start gap-2 text-xs text-[#DC2626]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] flex items-start gap-2 text-xs text-[#16A34A]">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSetupSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Lead Administrator"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@platform.edu"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full pl-9 pr-8 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B]"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-9 pr-8 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-semibold rounded-lg text-xs shadow-subtle transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Provisioning Administrator...</span>
                </>
              ) : (
                <span>Complete Administrator Setup</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
