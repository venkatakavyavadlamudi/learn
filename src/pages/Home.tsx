import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Bot,
  Compass,
  Target,
  Zap,
  Briefcase,
  Mic,
  Users,
  Building,
  GraduationCap,
  Award,
  CheckCircle2,
  Send,
  Mail,
  HelpCircle,
  Building2,
  Check,
} from 'lucide-react';

export const Home: React.FC = () => {
  const { navigate, scrollToSection } = useRouter();

  // Scroll to hash on mount if present
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setTimeout(() => {
          const el = document.getElementById(hash);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 120);
      }
    }
  }, []);

  // Interactive sample state for the hero preview
  const [interactiveInput, setInteractiveInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'user',
      text: 'Explain SQL JOINs with a real example.',
    },
    {
      role: 'model',
      text: 'An INNER JOIN matches records where keys exist in both tables (e.g., Students and Enrollments). A LEFT JOIN preserves all students even if they have not enrolled in a course yet.',
    },
  ]);

  const handleSampleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactiveInput.trim()) return;
    const query = interactiveInput.trim();
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: query },
      {
        role: 'model',
        text: `AI Tutor explanation for "${query}": We break this down into core fundamentals, real-world examples, and hands-on exercises. Start your journey with LearnAI to master this topic!`,
      },
    ]);
    setInteractiveInput('');
  };

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) return;

    setContactLoading(true);
    setTimeout(() => {
      setContactLoading(false);
      setContactSubmitted(true);
      setContactForm({ name: '', email: '', message: '' });
    }, 600);
  };

  // 6 Powerful Learning Features per specification
  const features = [
    {
      title: 'AI Learning Assistant',
      desc: 'Ask questions and get personalized learning support.',
      icon: Bot,
      isAi: true,
      tag: 'Interactive AI',
    },
    {
      title: 'Personalized Learning Roadmap',
      desc: 'Get a step-by-step learning path based on your career goal.',
      icon: Compass,
      isAi: false,
      tag: 'Adaptive Path',
    },
    {
      title: 'Skill Gap Detection',
      desc: 'Identify missing skills required for your target career.',
      icon: Target,
      isAi: false,
      tag: 'Diagnostic',
    },
    {
      title: 'Practice Recommendations',
      desc: 'Get recommended exercises based on your learning progress.',
      icon: Zap,
      isAi: false,
      tag: 'Personalized',
    },
    {
      title: 'AI Mock Interview',
      desc: 'Practice technical, HR and communication interviews.',
      icon: Mic,
      isAi: true,
      tag: 'Real-time Feedback',
    },
    {
      title: 'Career Guidance',
      desc: 'Understand your career readiness and recommended roles.',
      icon: Briefcase,
      isAi: false,
      tag: 'Industry Insights',
    },
  ];

  // 3 Solutions for Every Learning Environment per specification
  const solutions = [
    {
      category: 'STUDENTS',
      badge: 'Independent & Cohort Learners',
      icon: GraduationCap,
      description: 'Master in-demand industry skills with adaptive guidance and practice.',
      items: [
        'Personalized learning',
        'AI tutor',
        'Skill gap detection',
        'Career roadmap',
        'Mock interviews',
      ],
      buttonText: 'Start Learning Free',
      action: () => navigate('/signup'),
      featured: false,
    },
    {
      category: 'COLLEGES & INSTITUTIONS',
      badge: 'Campus & Academic Cohorts',
      icon: Building,
      description: 'Empower faculty and track student outcomes across accredited departments.',
      items: [
        'Student management',
        'Trainer management',
        'Mentor management',
        'Course management',
        'Student performance analytics',
      ],
      buttonText: 'Explore Campus Solution',
      action: () => scrollToSection('contact'),
      featured: true,
    },
    {
      category: 'TRAINING INSTITUTES',
      badge: 'Bootcamps & Vocational Centers',
      icon: Users,
      description: 'Streamline workforce readiness programs with detailed skill tracking.',
      items: [
        'Course tracking',
        'Student progress',
        'Trainer performance',
        'Skill analytics',
        'Career readiness',
      ],
      buttonText: 'Partner With Us',
      action: () => scrollToSection('contact'),
      featured: false,
    },
  ];

  // 3 Values for About section
  const aboutValues = [
    {
      title: 'Learn',
      description: 'Grasp foundational theory and software concepts through 24/7 AI-guided interactive explanations calibrated to your learning velocity.',
      icon: BookOpen,
      accent: '#32D6B0',
    },
    {
      title: 'Practice',
      description: 'Reinforce skills through personalized exercises, diagnostic coding problems, and simulated technical & HR interviews.',
      icon: Zap,
      accent: '#78D98A',
    },
    {
      title: 'Succeed',
      description: 'Close critical skill gaps, validate career readiness, and confidently secure high-impact roles in top technology companies.',
      icon: Award,
      accent: '#F2D64B',
    },
  ];

  return (
    <div className="bg-[#0A0D0C] text-[#F5F7F6] min-h-screen selection:bg-[#32D6B0] selection:text-[#0A0D0C]">
      {/* ====================================================
          1. HOME (HERO SECTION)
          id="home"
      ==================================================== */}
      <section
        id="home"
        className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden border-b border-[#29312C] bg-[#0A0D0C] bg-grid-pattern"
      >
        {/* Subtle decorative radial gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[360px] bg-[#32D6B0]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-[#78D98A]/8 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headline & Calls to Action */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#151A18] border border-[#29312C] text-xs font-medium text-[#32D6B0] shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#32D6B0]" />
                <span>AI Student Learning &amp; Career Platform</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F5F7F6] leading-[1.12] font-['Outfit']">
                Learn Smarter. <br />
                <span className="text-gradient-uniconnect">Build Skills.</span> Reach Your Career.
              </h1>

              <p className="text-base sm:text-lg text-[#A3ADA7] max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Personalized AI learning for students, colleges and training institutions. Identify skill gaps, practice with intelligent feedback, and master your career path.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 gradient-uniconnect text-[#0A0D0C] text-sm font-bold rounded-lg shadow-md hover:opacity-95 transition-all cursor-pointer glow-teal"
                >
                  <span>Start Learning</span>
                  <ArrowRight className="w-4 h-4 text-[#0A0D0C]" />
                </button>

                <button
                  onClick={() => scrollToSection('solutions')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#151A18] hover:bg-[#1B211E] text-[#F5F7F6] border border-[#29312C] text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <Building className="w-4 h-4 text-[#32D6B0]" />
                  <span>For Institutions</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-8 border-t border-[#29312C] grid grid-cols-3 gap-4 text-center lg:text-left">
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#F5F7F6] font-['Outfit']">94%</p>
                  <p className="text-xs text-[#A3ADA7] mt-0.5">Interview Pass Rate</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#F5F7F6] font-['Outfit']">12+</p>
                  <p className="text-xs text-[#A3ADA7] mt-0.5">Career Roadmaps</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#F5F7F6] font-['Outfit']">2.4x</p>
                  <p className="text-xs text-[#A3ADA7] mt-0.5">Faster Skill Mastery</p>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive AI Assistant Preview */}
            <div className="lg:col-span-5">
              <div className="bg-[#151A18] rounded-2xl border border-[#29312C] shadow-2xl overflow-hidden glow-teal-sm">
                {/* Header */}
                <div className="p-4 bg-[#101412] border-b border-[#29312C] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg gradient-uniconnect text-[#0A0D0C] flex items-center justify-center font-bold">
                      <Bot className="w-4 h-4 text-[#0A0D0C]" />
                    </div>
                    <div>
                      <h2 className="text-xs font-bold text-[#F5F7F6] flex items-center gap-1.5 font-['Outfit']">
                        AI Learning Assistant
                      </h2>
                      <p className="text-[11px] text-[#A3ADA7]">
                        Active • Instant Doubt Solving
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#1B211E] text-[#32D6B0] border border-[#29312C]">
                    Pedagogical AI
                  </span>
                </div>

                {/* Messages Body */}
                <div className="p-4 space-y-3 min-h-[220px] max-h-[260px] overflow-y-auto text-xs bg-[#151A18]">
                  {messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl p-3 leading-relaxed ${
                          m.role === 'user'
                            ? 'bg-[#1B211E] text-[#32D6B0] border border-[#29312C] rounded-br-none'
                            : 'bg-[#101412] text-[#F5F7F6] border border-[#29312C] rounded-bl-none'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Interactive Demo Form */}
                <form
                  onSubmit={handleSampleAsk}
                  className="p-3 bg-[#101412] border-t border-[#29312C] flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={interactiveInput}
                    onChange={(e) => setInteractiveInput(e.target.value)}
                    placeholder="Ask a question (e.g. Explain SQL JOINs)..."
                    className="flex-1 bg-[#151A18] border border-[#29312C] rounded-lg px-3 py-2 text-xs text-[#F5F7F6] placeholder:text-[#A3ADA7] focus:outline-none focus:ring-1 focus:ring-[#32D6B0]"
                  />
                  <button
                    type="submit"
                    className="p-2 gradient-uniconnect text-[#0A0D0C] hover:opacity-90 rounded-lg transition-opacity cursor-pointer font-bold"
                    aria-label="Send query"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================
          2. FEATURES SECTION
          id="features"
      ==================================================== */}
      <section id="features" className="py-16 md:py-24 bg-[#101412] border-b border-[#29312C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-semibold text-[#32D6B0] uppercase tracking-wider">
              Platform Features
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#F5F7F6] font-['Outfit']">
              Powerful Learning Features
            </h2>
            <p className="text-sm text-[#A3ADA7]">
              Designed to help students build the right skills, practice effectively and prepare for high-impact careers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-[#151A18] border border-[#29312C] hover:border-[#32D6B0]/50 transition-all duration-200 shadow-card hover:shadow-card-hover group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#1B211E] border border-[#29312C] flex items-center justify-center text-[#32D6B0] group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#1B211E] text-[#78D98A] border border-[#29312C]">
                      {feat.tag}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-[#F5F7F6] mb-2 flex items-center gap-2 font-['Outfit']">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A3ADA7] leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================================================
          3. SOLUTIONS SECTION
          id="solutions"
      ==================================================== */}
      <section id="solutions" className="py-16 md:py-24 bg-[#0A0D0C] border-b border-[#29312C] bg-grid-fine">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-semibold text-[#32D6B0] uppercase tracking-wider">
              Tailored For Everyone
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#F5F7F6] font-['Outfit']">
              Solutions for Every Learning Environment
            </h2>
            <p className="text-sm text-[#A3ADA7]">
              Scalable, role-governed environments for individual learners, academic departments, and training centers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {solutions.map((sol, idx) => {
              const Icon = sol.icon;
              return (
                <div
                  key={idx}
                  className={`bg-[#151A18] rounded-2xl border ${
                    sol.featured
                      ? 'border-[#32D6B0] shadow-2xl glow-teal-sm ring-1 ring-[#32D6B0]/30'
                      : 'border-[#29312C] shadow-card'
                  } p-6 sm:p-8 flex flex-col justify-between transition-all hover:border-[#32D6B0]/60`}
                >
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-[#1B211E] border border-[#29312C] text-[#32D6B0] flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-semibold text-[#78D98A] bg-[#1B211E] px-2.5 py-1 rounded border border-[#29312C]">
                        {sol.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-[#F5F7F6] tracking-tight font-['Outfit']">
                        {sol.category}
                      </h3>
                      <p className="text-xs text-[#A3ADA7] mt-1.5 leading-relaxed">
                        {sol.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#29312C] space-y-3">
                      {sol.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex items-start gap-2.5 text-xs text-[#F5F7F6]">
                          <CheckCircle2 className="w-4 h-4 text-[#78D98A] shrink-0 mt-0.5" />
                          <span className="font-medium text-[#A3ADA7]">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8">
                    <button
                      onClick={sol.action}
                      className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        sol.featured
                          ? 'gradient-uniconnect text-[#0A0D0C] font-bold shadow-md hover:opacity-95'
                          : 'bg-[#1B211E] hover:bg-[#202724] text-[#32D6B0] border border-[#29312C]'
                      }`}
                    >
                      {sol.buttonText}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================================================
          4. ABOUT SECTION
          id="about"
      ==================================================== */}
      <section id="about" className="py-16 md:py-24 bg-[#101412] border-b border-[#29312C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-semibold text-[#32D6B0] uppercase tracking-wider">
              Our Mission
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#F5F7F6] font-['Outfit']">
              About LearnAI
            </h2>
            <p className="text-base text-[#A3ADA7] leading-relaxed">
              LearnAI is an AI-powered student learning and career success platform designed to help students build the right skills, practice effectively and prepare for their careers.
            </p>
          </div>

          {/* 3 Simple Values: Learn, Practice, Succeed */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {aboutValues.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div
                  key={idx}
                  className="bg-[#151A18] rounded-2xl border border-[#29312C] p-8 text-center space-y-4 shadow-card hover:border-[#32D6B0]/50 transition-all"
                >
                  <div
                    className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-[#1B211E] border border-[#29312C]"
                    style={{ color: val.accent }}
                  >
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-[#F5F7F6] font-['Outfit']">
                    {val.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A3ADA7] leading-relaxed">
                    {val.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 p-6 rounded-2xl bg-[#151A18] border border-[#29312C] text-center max-w-3xl mx-auto">
            <p className="text-xs sm:text-sm text-[#78D98A] font-medium leading-relaxed">
              Built on transparent pedagogical standards with zero hallucinations, complete institution data isolation, and deep alignment with modern hiring standards.
            </p>
          </div>
        </div>
      </section>

      {/* ====================================================
          5. CONTACT SECTION
          id="contact"
      ==================================================== */}
      <section id="contact" className="py-16 md:py-24 bg-[#0A0D0C] border-b border-[#29312C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-semibold text-[#32D6B0] uppercase tracking-wider">
              Get in Touch
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#F5F7F6] font-['Outfit']">
              Let's Build Better Learning Experiences
            </h2>
            <p className="text-sm text-[#A3ADA7]">
              Have questions about student onboarding, curriculum alignment, or enterprise institutional rollouts? Our team is here to assist.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start max-w-5xl mx-auto">
            {/* Contact Form */}
            <div className="lg:col-span-7 bg-[#151A18] rounded-2xl border border-[#29312C] p-6 sm:p-8 shadow-card">
              {contactSubmitted ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#1B211E] border border-[#29312C] text-[#78D98A] flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[#F5F7F6] font-['Outfit']">
                    Message Sent Successfully
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A3ADA7] max-w-sm mx-auto">
                    Thank you! We have received your inquiry. A member of our academic partnership team will respond within 24 hours.
                  </p>
                  <button
                    onClick={() => setContactSubmitted(false)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B211E] text-[#32D6B0] border border-[#29312C] hover:bg-[#202724] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#F5F7F6] mb-1.5">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="Your full name"
                      className="w-full px-3.5 py-2.5 bg-[#101412] border border-[#29312C] rounded-lg text-xs text-[#F5F7F6] placeholder:text-[#A3ADA7]/60 focus:outline-none focus:ring-1 focus:ring-[#32D6B0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#F5F7F6] mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="name@institution.edu or personal email"
                      className="w-full px-3.5 py-2.5 bg-[#101412] border border-[#29312C] rounded-lg text-xs text-[#F5F7F6] placeholder:text-[#A3ADA7]/60 focus:outline-none focus:ring-1 focus:ring-[#32D6B0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#F5F7F6] mb-1.5">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Tell us how we can help your learning journey or institution..."
                      className="w-full px-3.5 py-2.5 bg-[#101412] border border-[#29312C] rounded-lg text-xs text-[#F5F7F6] placeholder:text-[#A3ADA7]/60 focus:outline-none focus:ring-1 focus:ring-[#32D6B0]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={contactLoading}
                    className="w-full py-3 px-4 gradient-uniconnect hover:opacity-95 disabled:opacity-60 text-[#0A0D0C] text-xs font-bold rounded-lg shadow-sm transition-opacity cursor-pointer flex items-center justify-center gap-2 glow-teal-sm"
                  >
                    {contactLoading ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Direct Information Channels per specification */}
            <div className="lg:col-span-5 space-y-4">
              {/* Email */}
              <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#1B211E] border border-[#29312C] text-[#32D6B0] flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#F5F7F6] uppercase tracking-wider font-['Outfit']">
                    Email
                  </h3>
                  <p className="text-xs text-[#A3ADA7] mt-0.5">
                    General questions and student inquiries
                  </p>
                  <a
                    href="mailto:support@learnai.edu"
                    className="inline-block mt-2 text-xs font-semibold text-[#32D6B0] hover:underline"
                  >
                    support@learnai.edu
                  </a>
                </div>
              </div>

              {/* Support */}
              <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#1B211E] border border-[#29312C] text-[#78D98A] flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#F5F7F6] uppercase tracking-wider font-['Outfit']">
                    Support
                  </h3>
                  <p className="text-xs text-[#A3ADA7] mt-0.5">
                    Technical assistance, course access, and mock interview help
                  </p>
                  <span className="inline-block mt-2 text-xs font-semibold text-[#78D98A]">
                    24/7 Platform Assistance
                  </span>
                </div>
              </div>

              {/* For Institutions */}
              <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#1B211E] border border-[#29312C] text-[#F2D64B] flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#F5F7F6] uppercase tracking-wider font-['Outfit']">
                    For Institutions
                  </h3>
                  <p className="text-xs text-[#A3ADA7] mt-0.5">
                    Campus deployments, trainer setups, and licensing
                  </p>
                  <a
                    href="mailto:institutions@learnai.edu"
                    className="inline-block mt-2 text-xs font-semibold text-[#F2D64B] hover:underline"
                  >
                    institutions@learnai.edu
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 md:py-20 bg-[#101412]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#151A18] border border-[#29312C] rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#32D6B0]/5 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-2xl sm:text-4xl font-bold text-[#F5F7F6] font-['Outfit'] relative z-10">
              Ready to Accelerate Your Career Success?
            </h2>
            <p className="text-sm sm:text-base text-[#A3ADA7] max-w-2xl mx-auto leading-relaxed relative z-10">
              Join thousands of students and educators utilizing AI-powered diagnostic tutoring, real-time mock interviews, and personalized career roadmaps.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 relative z-10">
              <button
                onClick={() => navigate('/signup')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 gradient-uniconnect text-[#0A0D0C] text-sm font-bold rounded-lg shadow-md hover:opacity-95 transition-opacity cursor-pointer glow-teal"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-4 h-4 text-[#0A0D0C]" />
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1B211E] hover:bg-[#202724] text-[#F5F7F6] border border-[#29312C] text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <span>Contact Our Team</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
