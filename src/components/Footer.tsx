import React from 'react';
import { Link } from '../context/RouterContext';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0A0D0C] border-t border-[#29312C] mt-auto text-[#A3ADA7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg gradient-uniconnect text-[#0A0D0C] flex items-center justify-center font-bold">
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
              <span className="text-lg font-bold text-[#F5F7F6] font-['Outfit']">
                LearnAI
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-[#A3ADA7] max-w-sm leading-relaxed">
              Personalized AI learning and career success platform for students, colleges, and training institutions.
            </p>
            <p className="text-xs font-medium text-[#32D6B0]">
              "Learn Smarter. Build Skills. Reach Your Career."
            </p>
            <div className="flex items-center space-x-2 pt-2 text-[#A3ADA7]">
              <a
                href="#github"
                aria-label="GitHub"
                className="w-8 h-8 rounded-lg bg-[#151A18] hover:bg-[#1B211E] hover:text-[#32D6B0] flex items-center justify-center transition-colors border border-[#29312C]"
              >
                <Github className="w-3.5 h-3.5" />
              </a>
              <a
                href="#linkedin"
                aria-label="LinkedIn"
                className="w-8 h-8 rounded-lg bg-[#151A18] hover:bg-[#1B211E] hover:text-[#32D6B0] flex items-center justify-center transition-colors border border-[#29312C]"
              >
                <Linkedin className="w-3.5 h-3.5" />
              </a>
              <a
                href="#twitter"
                aria-label="Twitter"
                className="w-8 h-8 rounded-lg bg-[#151A18] hover:bg-[#1B211E] hover:text-[#32D6B0] flex items-center justify-center transition-colors border border-[#29312C]"
              >
                <Twitter className="w-3.5 h-3.5" />
              </a>
              <a
                href="mailto:support@learnai.edu"
                aria-label="Email"
                className="w-8 h-8 rounded-lg bg-[#151A18] hover:bg-[#1B211E] hover:text-[#32D6B0] flex items-center justify-center transition-colors border border-[#29312C]"
              >
                <Mail className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#F5F7F6] uppercase tracking-wider font-['Outfit']">Navigation</p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/#home" className="hover:text-[#32D6B0] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-[#32D6B0] transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#solutions" className="hover:text-[#32D6B0] transition-colors">
                  Solutions
                </Link>
              </li>
              <li>
                <Link href="/#about" className="hover:text-[#32D6B0] transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="hover:text-[#32D6B0] transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Pillars */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#F5F7F6] uppercase tracking-wider font-['Outfit']">Platform</p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/#features" className="hover:text-[#32D6B0] transition-colors">
                  AI Tutor &amp; Diagnostics
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-[#32D6B0] transition-colors">
                  Career Roadmaps
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-[#32D6B0] transition-colors">
                  Mock Interview Simulator
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-[#32D6B0] transition-colors">
                  Skill Gap Detection
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-[#32D6B0] transition-colors">
                  Institutional Cohorts
                </Link>
              </li>
            </ul>
          </div>

          {/* Institutional Access */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#F5F7F6] uppercase tracking-wider font-['Outfit']">Roles</p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/login" className="hover:text-[#32D6B0] transition-colors">
                  Admin Portal
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#32D6B0] transition-colors">
                  Trainer Console
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#32D6B0] transition-colors">
                  Mentor Portal
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#32D6B0] transition-colors">
                  Student Learning Center
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-[#32D6B0] transition-colors">
                  Public Signup
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-[#29312C] flex flex-col sm:flex-row items-center justify-between text-xs text-[#A3ADA7] gap-4">
          <p>© {new Date().getFullYear()} LearnAI. Designed for student mastery and institutional excellence.</p>
          <div className="flex items-center space-x-6">
            <a href="#privacy" className="hover:text-[#F5F7F6] transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-[#F5F7F6] transition-colors">Terms of Service</a>
            <a href="#cookies" className="hover:text-[#F5F7F6] transition-colors">Cookie Preferences</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
