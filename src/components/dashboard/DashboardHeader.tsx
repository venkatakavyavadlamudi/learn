import React, { useState } from 'react';
import { User } from '../../types';
import { useRouter } from '../../context/RouterContext';
import { authService } from '../../services/authService';
import {
  Bell,
  Search,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  Shield,
  GraduationCap,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  currentUser: User | null;
  onOpenMobileSidebar?: () => void;
  onMenuClick?: () => void;
  notificationsCount?: number;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  searchPlaceholder?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  currentUser,
  onOpenMobileSidebar,
  onMenuClick,
  notificationsCount,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search courses, skills, or students...',
}) => {
  const effectiveMenuClick = onOpenMobileSidebar || onMenuClick;
  const { navigate } = useRouter();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const notifications = [
    { id: 'n-1', text: 'New diagnostic assessment available: System Design 101', time: '10m ago', unread: true },
    { id: 'n-2', text: 'Mentor scheduled feedback review for tomorrow at 3 PM', time: '1h ago', unread: true },
    { id: 'n-3', text: 'Curriculum syllabus updated for Generative AI track', time: 'Yesterday', unread: false },
  ];

  const handleLogout = async () => {
    await authService.logout();
    window.location.replace('/login');
  };

  const getRoleBadge = (role?: string) => {
    const r = String(role || 'student').toLowerCase();
    if (r.includes('admin')) return { text: 'Admin', color: 'text-[#F2D64B] bg-[#232014] border-[#F2D64B]/30' };
    if (r === 'mentor') return { text: 'Mentor', color: 'text-[#32D6B0] bg-[#101F1B] border-[#32D6B0]/30' };
    if (r === 'trainer') return { text: 'Trainer', color: 'text-[#78D98A] bg-[#152317] border-[#78D98A]/30' };
    return { text: 'Student', color: 'text-[#32D6B0] bg-[#101F1B] border-[#32D6B0]/30' };
  };

  const roleBadge = getRoleBadge(currentUser?.role);

  return (
    <header className="sticky top-0 z-30 bg-[#0A0D0C]/90 backdrop-blur-md border-b border-[#29312C] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Titles */}
      <div className="flex items-center gap-3 min-w-0">
        {effectiveMenuClick && (
          <button
            onClick={effectiveMenuClick}
            className="md:hidden p-2 text-[#A3ADA7] hover:text-[#F5F7F6] rounded-xl hover:bg-[#151A18] border border-[#29312C] cursor-pointer"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-xl font-bold font-['Outfit'] tracking-tight text-[#F5F7F6] truncate">
              {title}
            </h1>
            <span
              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${roleBadge.color}`}
            >
              {roleBadge.text}
            </span>
          </div>
          {subtitle && (
            <p className="text-xs text-[#A3ADA7] truncate hidden sm:block mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Middle/Right: Search bar if enabled */}
      <div className="flex items-center gap-3">
        {onSearchChange !== undefined && (
          <div className="relative hidden lg:block w-64 xl:w-80">
            <Search className="w-4 h-4 text-[#A3ADA7] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-1.5 bg-[#151A18] border border-[#29312C] rounded-xl text-xs text-[#F5F7F6] placeholder-[#A3ADA7] focus:outline-none focus:border-[#32D6B0] transition-colors"
            />
          </div>
        )}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl bg-[#151A18] border border-[#29312C] text-[#A3ADA7] hover:text-[#F5F7F6] hover:border-[#3a453f] transition-all cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#32D6B0]" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[#151A18] border border-[#29312C] rounded-2xl shadow-2xl p-4 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#29312C]">
                <span className="text-xs font-bold text-[#F5F7F6]">Platform Notifications</span>
                <button
                  onClick={() => setNotificationsOpen(false)}
                  className="text-[#A3ADA7] hover:text-[#F5F7F6]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                      n.unread
                        ? 'bg-[#101F1B]/40 border-[#32D6B0]/30 text-[#F5F7F6]'
                        : 'bg-[#101412] border-[#29312C] text-[#A3ADA7]'
                    }`}
                  >
                    <p className="text-[11px] leading-relaxed">{n.text}</p>
                    <span className="text-[10px] text-[#A3ADA7]/70 block">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 bg-[#151A18] border border-[#29312C] hover:border-[#3a453f] rounded-xl transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#32D6B0] to-[#F2D64B] flex items-center justify-center text-[#0A0D0C] font-bold text-xs shrink-0">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-[#F5F7F6] leading-tight truncate max-w-[120px]">
                {currentUser?.name || 'Authorized User'}
              </p>
              <p className="text-[10px] text-[#A3ADA7] truncate max-w-[120px]">
                {currentUser?.email || ''}
              </p>
            </div>
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-[#151A18] border border-[#29312C] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2 border-b border-[#29312C] text-xs">
                <p className="font-bold text-[#F5F7F6] truncate">{currentUser?.name}</p>
                <p className="text-[11px] text-[#A3ADA7] truncate">{currentUser?.email}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#A3ADA7] hover:text-[#F5F7F6] hover:bg-[#1B211E] rounded-xl transition-colors cursor-pointer"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#FF7272] hover:bg-[#261517] rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
