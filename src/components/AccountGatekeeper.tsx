import React, { useState } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { useRouter } from '../context/RouterContext';
import {
  ShieldAlert,
  MailCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
  Loader2,
} from 'lucide-react';

interface AccountGatekeeperProps {
  user: User;
  onRefresh?: () => void;
}

export const AccountGatekeeper: React.FC<AccountGatekeeperProps> = ({ user, onRefresh }) => {
  const { navigate } = useRouter();
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [tokenInput, setTokenInput] = useState(user.emailVerificationToken || '');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleVerifyEmail = async () => {
    setIsVerifyingEmail(true);
    setMessage(null);
    const res = await authService.verifyEmail(user.email, tokenInput.trim());
    setIsVerifyingEmail(false);
    if (res.success) {
      setMessage({ text: 'Email successfully verified! Refreshing account status...', type: 'success' });
      setTimeout(() => {
        if (onRefresh) onRefresh();
        else window.location.reload();
      }, 1500);
    } else {
      setMessage({ text: res.error || 'Failed to verify email.', type: 'error' });
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // 1. Email Verification Gate
  if (!user.emailVerified) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-[#020B18]">
        <div className="max-w-md w-full bg-[#061A2E] border border-[#062B4F] rounded-3xl p-8 space-y-6 shadow-2xl blue-glow text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
            <MailCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Security Step 1 of 2
            </span>
            <h2 className="text-2xl font-bold font-['Poppins',sans-serif] text-white">
              Verify Your Email Address
            </h2>
            <p className="text-xs text-[#B8C7D9] leading-relaxed">
              We need to confirm your email address (<strong className="text-white">{user.email}</strong>) before your account can proceed to administrator approval.
            </p>
          </div>

          {message && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                message.type === 'success'
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                  : 'bg-red-950/60 text-red-300 border-red-500/40'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Verification Code input or 1-Click Verification simulation */}
          <div className="p-4 bg-[#020B18] rounded-2xl border border-[#062B4F] space-y-3 text-left">
            <label className="block text-[11px] font-mono text-[#71849A] uppercase">
              Verification Code or Instant Confirmation
            </label>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Enter verification code..."
              className="w-full bg-[#061A2E] border border-[#062B4F] rounded-xl px-3 py-2 text-xs text-white placeholder-[#71849A] focus:outline-none focus:border-[#19E6FF] font-mono"
            />
            <button
              onClick={handleVerifyEmail}
              disabled={isVerifyingEmail}
              className="w-full py-2.5 bg-[#0B6FFF] hover:bg-[#168BFF] disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              {isVerifyingEmail ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Email...</span>
                </>
              ) : (
                <>
                  <MailCheck className="w-4 h-4" />
                  <span>Verify Email Now</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-[#062B4F]">
            <button
              onClick={() => {
                setMessage({ text: 'Verification token re-sent to ' + user.email, type: 'success' });
              }}
              className="text-[#19E6FF] hover:underline text-[11px]"
            >
              Resend verification email
            </button>
            <button
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px]"
            >
              <LogOut className="w-3 h-3" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Pending Admin Approval Gate
  if (user.status === 'pending') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-[#020B18]">
        <div className="max-w-lg w-full bg-[#061A2E] border border-[#062B4F] rounded-3xl p-8 space-y-6 shadow-2xl blue-glow text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-[#0B6FFF]/50 text-[#19E6FF] flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-blue-500/10 text-[#19E6FF] border border-blue-500/30">
              Security Step 2 of 2
            </span>
            <h2 className="text-2xl font-bold font-['Poppins',sans-serif] text-white">
              Registration Under Admin Review
            </h2>
            <p className="text-xs text-[#B8C7D9] leading-relaxed">
              Your identity has been verified. In compliance with LearnAI governance rules, all new <strong className="text-white uppercase">{user.role}</strong> profiles require administrator approval before portal access is unlocked.
            </p>
          </div>

          {/* Verification Checklist */}
          <div className="p-4 bg-[#020B18] rounded-2xl border border-[#062B4F] space-y-3 text-xs text-left">
            <span className="text-[10px] font-mono text-[#71849A] uppercase tracking-wider block">
              Credential Verification Status
            </span>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 bg-[#061A2E]/60 rounded-xl border border-[#062B4F]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-white font-semibold">Email Verification</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                  Verified
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#061A2E]/60 rounded-xl border border-[#062B4F]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-white font-semibold">
                    {user.role === 'mentor'
                      ? 'Mentor Authorization Code'
                      : user.role === 'trainer'
                      ? 'Trainer Authorization Code'
                      : 'Student Enrollment Data'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                  Validated
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#061A2E]/60 rounded-xl border border-amber-500/40">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                  <span className="text-white font-semibold">Administrator Approval</span>
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">
                  Pending Review
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#020B18]/60 rounded-xl border border-[#062B4F] text-[11px] text-[#71849A]">
            Registered email: <strong className="text-white">{user.email}</strong> • Role: <strong className="text-[#19E6FF] uppercase font-mono">{user.role}</strong>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={() => {
                if (onRefresh) onRefresh();
                else window.location.reload();
              }}
              className="flex-1 py-2.5 bg-[#020B18] hover:bg-[#062B4F] border border-[#062B4F] text-[#B8C7D9] hover:text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Check Status</span>
            </button>

            <button
              onClick={handleLogout}
              className="py-2.5 px-4 bg-red-950/40 hover:bg-red-950/80 border border-red-500/40 text-red-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Rejected Gate
  if (user.status === 'rejected') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-[#020B18]">
        <div className="max-w-md w-full bg-[#061A2E] border border-red-500/50 rounded-3xl p-8 space-y-5 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30">
              Application Status
            </span>
            <h2 className="text-2xl font-bold font-['Poppins',sans-serif] text-white">
              Registration Not Approved
            </h2>
            <p className="text-xs text-[#B8C7D9] leading-relaxed">
              Your registration application was reviewed by the administrator and could not be approved at this time.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2.5 bg-[#0B6FFF] hover:bg-[#168BFF] text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
          >
            <span>Return to Login</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};
