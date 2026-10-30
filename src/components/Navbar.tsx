import React, { useState, useEffect } from 'react';
import { useRouter, Link } from '../context/RouterContext';
import { authService } from '../services/authService';
import { User } from '../types';
import {
  Menu,
  X,
  User as UserIcon,
  LayoutDashboard,
  LogOut,
  ArrowRight,
  ShieldCheck,
  Users,
  Compass,
  GraduationCap,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

interface NavSection {
  name: string;
  id: string;
}

const SECTION_LINKS: NavSection[] = [
  { name: 'Home', id: 'home' },
  { name: 'Features', id: 'features' },
  { name: 'Solutions', id: 'solutions' },
  { name: 'About', id: 'about' },
  { name: 'Contact', id: 'contact' },
];

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { currentPath, navigate, scrollToSection } = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('home');

  useEffect(() => {
    const unsubscribe = authService.subscribe((user) => {
      setCurrentUser(user);
    });

    return unsubscribe;
  }, []);

  // Track active section on scroll when on landing page
  useEffect(() => {
    if (currentPath !== '/') {
      return;
    }

    const handleScroll = () => {
      const scrollY = window.scrollY;

      if (scrollY < 200) {
        setActiveSection('home');
        return;
      }

      const sections = ['contact', 'about', 'solutions', 'features', 'home'];
      const scrollPosition = scrollY + 180;

      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(id);
            return;
          }
        }
      }
      setActiveSection('home');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentPath]);

  const handleLogout = async () => {
    await authService.logout();
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    window.location.replace('/login');
  };

  const handleSectionClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    setActiveSection(sectionId);

    if (sectionId === 'home') {
      if (currentPath === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.replaceState(null, '', '/');
      } else {
        navigate('/');
      }
      return;
    }

    scrollToSection(sectionId);
  };

  const isDashboardRoute =
    currentPath === '/dashboard' ||
    currentPath.startsWith('/student') ||
    currentPath === '/admin' ||
    currentPath.startsWith('/admin/') ||
    currentPath.startsWith('/super-admin') ||
    currentPath.startsWith('/trainer') ||
    currentPath.startsWith('/mentor');

  const roleDashboardPath = currentUser
    ? authService.getRoleDashboardPath(currentUser.role)
    : '/dashboard';

  const getRoleDisplay = () => {
    if (!currentUser) {
      return {
        label: 'Dashboard',
        icon: LayoutDashboard,
        badgeClass: 'bg-[#151A18] text-[#32D6B0] border-[#29312C]',
      };
    }
    switch (currentUser.role) {
      case 'institution_admin':
      case 'admin':
        return {
          label: 'Institution Admin',
          icon: ShieldCheck,
          badgeClass: 'bg-[#151A18] text-[#32D6B0] border-[#29312C]',
        };
      case 'trainer':
        return {
          label: 'Trainer',
          icon: Users,
          badgeClass: 'bg-[#151A18] text-[#78D98A] border-[#29312C]',
        };
      case 'mentor':
        return {
          label: 'Mentor',
          icon: Compass,
          badgeClass: 'bg-[#151A18] text-[#B4E85A] border-[#29312C]',
        };
      case 'public_user':
      case 'student':
      default:
        return {
          label: currentUser.Organization_ID ? 'Student' : '',
          icon: GraduationCap,
          badgeClass: 'bg-[#151A18] text-[#32D6B0] border-[#29312C]',
        };
    }
  };

  const roleDisplay = getRoleDisplay();
  const RoleIcon = roleDisplay.icon;

  return (
    <header className="sticky top-0 z-50 bg-[#0A0D0C]/90 backdrop-blur-md border-b border-[#29312C] transition-all h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Left: Brand Logo & Optional Dashboard Toggle */}
          <div className="flex items-center gap-3">
            {isDashboardRoute && onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="md:hidden p-2 rounded-lg text-[#A3ADA7] hover:text-[#F5F7F6] hover:bg-[#151A18] transition-colors"
                aria-label="Toggle navigation drawer"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => handleSectionClick('home')}
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg gradient-uniconnect flex items-center justify-center text-[#0A0D0C] shadow-sm font-black transition-transform group-hover:scale-105">
                <svg
                  className="w-4 h-4 text-[#0A0D0C]"
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
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold tracking-tight text-[#F5F7F6] font-['Outfit']">
                  LearnAI
                </span>
                <span className="text-[10px] font-medium tracking-wide text-[#32D6B0] border border-[#29312C] bg-[#151A18] px-1.5 py-0.5 rounded hidden sm:inline-block">
                  EdTech Platform
                </span>
              </div>
            </button>
          </div>

          {/* Center: Desktop Navigation Links */}
          {!isDashboardRoute && (
            <nav className="hidden md:flex items-center gap-1">
              {SECTION_LINKS.map((link) => {
                const isCurrentActive = currentPath === '/' && activeSection === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => handleSectionClick(link.id)}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                      isCurrentActive
                        ? 'text-[#32D6B0] bg-[#151A18] border border-[#29312C] font-semibold'
                        : 'text-[#A3ADA7] hover:text-[#F5F7F6] hover:bg-[#101412]'
                    }`}
                  >
                    {link.name}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                {/* Dashboard Nav button if not already on dashboard */}
                {!isDashboardRoute && (
                  <Link
                    href={roleDashboardPath}
                    className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#32D6B0] bg-[#151A18] hover:bg-[#1B211E] border border-[#29312C] transition-colors"
                  >
                    <RoleIcon className="w-3.5 h-3.5 text-[#32D6B0]" />
                    <span>Go to Dashboard</span>
                  </Link>
                )}

                {/* User Menu Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pl-2 pr-3 rounded-lg border border-[#29312C] bg-[#151A18] hover:bg-[#1B211E] transition-colors text-left"
                    aria-label="User account menu"
                  >
                    <div className="w-7 h-7 rounded-md gradient-uniconnect text-[#0A0D0C] flex items-center justify-center font-bold text-xs shrink-0">
                      {currentUser.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || 'US'}
                    </div>
                    <div className="hidden sm:block text-left">
                      <span className="text-xs font-semibold text-[#F5F7F6] block leading-tight truncate max-w-[110px]">
                        {currentUser.name}
                      </span>
                      {roleDisplay.label && (
                        <span className="text-[10px] text-[#A3ADA7] block leading-tight truncate">
                          {roleDisplay.label}
                        </span>
                      )}
                    </div>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-[#151A18] rounded-xl shadow-2xl border border-[#29312C] py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-4 py-3 border-b border-[#29312C]">
                        <p className="text-xs font-bold text-[#F5F7F6] truncate">
                          {currentUser.name}
                        </p>
                        <p className="text-[11px] text-[#A3ADA7] truncate">
                          {currentUser.email}
                        </p>
                        {roleDisplay.label && (
                          <span
                            className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-semibold border rounded ${roleDisplay.badgeClass}`}
                          >
                            {roleDisplay.label}
                          </span>
                        )}
                      </div>

                      <Link
                        href={roleDashboardPath}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-xs font-medium text-[#A3ADA7] hover:bg-[#1B211E] hover:text-[#F5F7F6]"
                      >
                        <RoleIcon className="w-3.5 h-3.5 mr-2.5 text-[#32D6B0]" />
                        <span>My Dashboard</span>
                      </Link>

                      <Link
                        href="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-xs font-medium text-[#A3ADA7] hover:bg-[#1B211E] hover:text-[#F5F7F6]"
                      >
                        <UserIcon className="w-3.5 h-3.5 mr-2.5 text-[#A3ADA7]" />
                        <span>My Profile</span>
                      </Link>

                      {/* Dev Preview Links for Admins */}
                      {(currentUser.role === 'admin' || currentUser.role === 'institution_admin') && (
                        <>
                          <div className="border-t border-[#29312C] my-1"></div>
                          <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-[#32D6B0]">
                            Dev Preview Portals
                          </div>
                          <Link
                            href="/trainer"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center px-4 py-2 text-xs font-medium text-[#A3ADA7] hover:bg-[#1B211E] hover:text-[#32D6B0]"
                          >
                            <Users className="w-3.5 h-3.5 mr-2.5 text-[#32D6B0]" />
                            <span>Preview Trainer Portal</span>
                          </Link>
                          <Link
                            href="/mentor"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center px-4 py-2 text-xs font-medium text-[#A3ADA7] hover:bg-[#1B211E] hover:text-[#B4E85A]"
                          >
                            <Compass className="w-3.5 h-3.5 mr-2.5 text-[#B4E85A]" />
                            <span>Preview Mentor Portal</span>
                          </Link>
                        </>
                      )}

                      <div className="border-t border-[#29312C] my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-xs font-medium text-[#FF7272] hover:bg-[#1B211E] text-left transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5 mr-2.5 text-[#FF7272]" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-medium text-[#A3ADA7] hover:text-[#F5F7F6] rounded-lg hover:bg-[#151A18] transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#0A0D0C] gradient-uniconnect hover:opacity-95 rounded-lg shadow-sm transition-opacity glow-teal-sm"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Mobile Hamburger on marketing pages */}
            {!isDashboardRoute && (
              <div className="flex items-center md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-lg text-[#A3ADA7] hover:text-[#F5F7F6] hover:bg-[#151A18]"
                  aria-label="Toggle navigation menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer on marketing pages */}
      {!isDashboardRoute && mobileMenuOpen && (
        <div className="md:hidden border-b border-[#29312C] bg-[#101412] px-4 pt-3 pb-6 space-y-3 shadow-2xl">
          <div className="space-y-1">
            {SECTION_LINKS.map((link) => {
              const isCurrentActive = currentPath === '/' && activeSection === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleSectionClick(link.id)}
                  className={`block w-full text-left px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isCurrentActive
                      ? 'text-[#32D6B0] bg-[#151A18] border border-[#29312C] font-semibold'
                      : 'text-[#A3ADA7] hover:text-[#F5F7F6] hover:bg-[#151A18]'
                  }`}
                >
                  {link.name}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#29312C]">
            {currentUser ? (
              <div className="space-y-2">
                <Link
                  href={roleDashboardPath}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center w-full px-3 py-2 rounded-lg text-xs font-semibold text-[#0A0D0C] gradient-uniconnect"
                >
                  <RoleIcon className="w-4 h-4 mr-2.5" />
                  <span>Open {roleDisplay.label} Dashboard</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2 rounded-lg text-xs font-medium text-[#FF7272] hover:bg-[#151A18]"
                >
                  <LogOut className="w-4 h-4 mr-2.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-2 text-xs font-semibold text-[#F5F7F6] bg-[#151A18] hover:bg-[#1B211E] rounded-lg border border-[#29312C]"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-2 text-xs font-semibold text-[#0A0D0C] gradient-uniconnect rounded-lg"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
