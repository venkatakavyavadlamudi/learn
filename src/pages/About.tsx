import React from 'react';
import { useRouter } from '../context/RouterContext';
import {
  GraduationCap,
  Users,
  Compass,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Building,
  ShieldCheck,
} from 'lucide-react';

export const About: React.FC = () => {
  const { navigate } = useRouter();

  const userCards = [
    {
      role: 'Students',
      title: 'Personalized Learning & Career Growth',
      description: 'Master core curricula, query the AI tutor, identify skill gaps, and track career readiness.',
      icon: GraduationCap,
      highlights: [
        'Instant answers from AI Learning Assistant',
        'Transparent skill proficiency diagnostics',
        'Direct connection to portfolio projects',
      ],
    },
    {
      role: 'Trainers',
      title: 'Intelligent Content & Cohort Insights',
      description: 'Manage course content, track class velocity, and focus high-touch time on deep mentoring.',
      icon: Users,
      highlights: [
        'Automated assistance for repetitive foundational doubts',
        'Cohort progress analytics and struggling alerts',
        'Curriculum alignment with industry demands',
      ],
    },
    {
      role: 'Mentors',
      title: 'Targeted Guidance & Career Coaching',
      description: 'Support students with objective skill profiles and actionable interview preparation.',
      icon: Compass,
      highlights: [
        'Verified student skill data & completion records',
        'Efficient escalation for complex technical queries',
        'Resume and career trajectory recommendations',
      ],
    },
    {
      role: 'Institutions & Colleges',
      title: 'Multi-Tenant Academic Governance',
      description: 'Isolate institutional cohorts, empower department admins, and benchmark placement outcomes.',
      icon: Building,
      highlights: [
        'Strict tenant-level student data isolation',
        'Placement readiness & skill gap metrics',
        'Customized curriculum delivery',
      ],
    },
  ];

  return (
    <div className="bg-[#0A0D0C] text-[#F5F7F6] min-h-screen py-12 sm:py-16 space-y-16">
      {/* 1. HERO */}
      <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1B211E] border border-[#29312C] text-[#32D6B0] text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>About the Platform</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F5F7F6]">
          AI-Powered Learning & Career Acceleration
        </h1>
        <p className="text-base text-[#A3ADA7] max-w-2xl mx-auto leading-relaxed">
          Bridging the gap between academic instruction and industry employment through curriculum-grounded AI tutoring, skill gap diagnostics, and mentorship.
        </p>
      </div>

      {/* 2. ROLE STAKEHOLDERS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-[#F5F7F6]">
            Built for the Entire Educational Ecosystem
          </h2>
          <p className="text-xs sm:text-sm text-[#A3ADA7] mt-1">
            Dedicated user experiences designed for every stakeholder.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {userCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-[#1B211E] text-[#32D6B0] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#32D6B0] uppercase tracking-wider">
                      {card.role}
                    </span>
                    <h3 className="text-base font-bold text-[#F5F7F6] mt-1">
                      {card.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[#A3ADA7] leading-relaxed">
                    {card.description}
                  </p>
                  <div className="space-y-1.5 pt-2 border-t border-[#29312C]">
                    {card.highlights.map((h, hIdx) => (
                      <div key={hIdx} className="flex items-start gap-1.5 text-xs text-[#F5F7F6]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#78D98A] shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. CTA */}
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#1B211E] border border-[#29312C] space-y-4">
          <h3 className="text-xl sm:text-3xl font-bold text-[#F5F7F6]">
            Ready to Experience Modern AI Education?
          </h3>
          <p className="text-xs sm:text-sm text-[#A3ADA7] max-w-lg mx-auto">
            Get started immediately as a student or connect your institution with our engineering team.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => navigate('/signup')}
              className="px-6 py-2.5 bg-[#32D6B0] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-subtle transition-colors"
            >
              Start Learning Now
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="px-6 py-2.5 bg-[#151A18] hover:bg-[#0A0D0C] text-[#F5F7F6] border border-[#29312C] text-xs sm:text-sm font-semibold rounded-lg transition-colors"
            >
              Contact Team
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
