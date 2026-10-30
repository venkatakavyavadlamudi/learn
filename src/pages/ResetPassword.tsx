import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { authService } from '../services/authService';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const { navigate } = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if we have an active session (which Supabase should have established from the URL fragment)
    const checkSession = async () => {
      if (!isSupabaseConfigured() || !supabase) return;
      
      // Give Supabase SDK a moment to parse the hash/fragment into a session
      setTimeout(async () => {
        if (!supabase) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Your password reset link is invalid or has expired. Please request a new one from the login page.');
        } else {
          console.log('[LearnAI Auth] Recovery session verified.');
        }
      }, 800);
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.updatePassword(newPassword);
      if (result.success) {
        setSuccess(true);
        // Automatically logout to clear the recovery session and force fresh login
        await authService.logout();
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(result.error || 'Failed to update password.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0A0D0C] bg-grid-pattern flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-2xl font-bold tracking-tight text-[#F5F7F6] font-['Outfit']">
          Set New Password
        </h1>
        <p className="mt-1.5 text-center text-xs sm:text-sm text-[#A3ADA7]">
          Secure your account with a new password
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#151A18] py-8 px-6 sm:px-8 rounded-2xl border border-[#29312C] shadow-2xl">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#101F1B] border border-[#32D6B0]/50 flex items-center justify-center mx-auto text-[#32D6B0]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#F5F7F6]">Password Updated</h3>
                <p className="text-xs text-[#A3ADA7]">Your password has been changed successfully. Redirecting you to the login page...</p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold text-[#0A0D0C] gradient-uniconnect hover:opacity-95 cursor-pointer"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3.5 rounded-xl bg-[#1B211E] border border-[#FF7272]/50 flex items-start gap-2.5 text-xs text-[#FF7272]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{error}</div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#F5F7F6] mb-1.5">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A3ADA7]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="block w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm bg-[#101412] border border-[#29312C] rounded-lg text-[#F5F7F6] placeholder:text-[#A3ADA7]/50 focus:outline-none focus:ring-1 focus:ring-[#32D6B0]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#A3ADA7] hover:text-[#F5F7F6]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F5F7F6] mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A3ADA7]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    className="block w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-[#101412] border border-[#29312C] rounded-lg text-[#F5F7F6] placeholder:text-[#A3ADA7]/50 focus:outline-none focus:ring-1 focus:ring-[#32D6B0]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold text-[#0A0D0C] gradient-uniconnect hover:opacity-95 focus:outline-none disabled:opacity-50 transition-opacity shadow-md glow-teal-sm cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#0A0D0C]" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-[#A3ADA7] hover:text-[#F5F7F6] pt-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Login</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
