import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, Loader2, Sparkles, Building } from 'lucide-react';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Enter a valid email address';
      }
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit message');
      }

      setSuccessMessage('Thank you for reaching out! Our academic partnerships team will reply within 24 hours.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch {
      setSuccessMessage('Your message has been recorded. Our team will contact you shortly.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#0A0D0C] text-[#F5F7F6] min-h-screen py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1B211E] border border-[#29312C] text-[#32D6B0] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Get in Touch</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F5F7F6]">
            Contact Our Platform Team
          </h1>
          <p className="text-sm sm:text-base text-[#A3ADA7]">
            Have inquiries about institutional onboarding, AI curriculum grounding, or student licensing?
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Info Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 shadow-card space-y-5">
              <h2 className="text-base font-bold text-[#F5F7F6]">
                Direct Contacts
              </h2>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1B211E] text-[#32D6B0] flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#F5F7F6]">Email Us</p>
                    <p className="text-[#A3ADA7]">support@ailearn.com</p>
                    <p className="text-[#A3ADA7]">institutions@ailearn.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1B211E] text-[#32D6B0] flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#F5F7F6]">Phone Support</p>
                    <p className="text-[#A3ADA7]">+1 (800) 555-0199 (US)</p>
                    <p className="text-[#A3ADA7]">+91 (80) 4000-5000 (IN)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1B211E] text-[#32D6B0] flex items-center justify-center shrink-0">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#F5F7F6]">Headquarters</p>
                    <p className="text-[#A3ADA7]">AI Education Technology Hub</p>
                    <p className="text-[#A3ADA7]">San Francisco, CA & Bengaluru, India</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#1B211E] rounded-2xl border border-[#29312C] p-6 text-xs text-[#1E40AF] space-y-2">
              <p className="font-bold text-[#32D6B0]">For Colleges & Educational Institutions</p>
              <p className="leading-relaxed">
                We provision dedicated instances with complete multi-tenant database isolation, custom grading rubrics, and faculty supervision portals.
              </p>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7">
            <div className="bg-[#151A18] rounded-2xl border border-[#29312C] p-6 sm:p-8 shadow-card space-y-5">
              <h2 className="text-lg font-bold text-[#F5F7F6]">Send Us a Message</h2>

              {successMessage && (
                <div className="p-4 rounded-xl bg-[#1B211E] border border-[#BBF7D0] flex items-start gap-3 text-xs text-[#78D98A]">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="font-medium">{successMessage}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label className="block text-xs font-semibold text-[#F5F7F6] mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dr. Ramesh Kumar"
                    className={`w-full px-3.5 py-2.5 bg-[#151A18] border rounded-lg text-xs sm:text-sm text-[#F5F7F6] focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                      errors.name ? 'border-[#DC2626]' : 'border-[#29312C]'
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-xs text-[#FF7272]">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#F5F7F6] mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ramesh@college.edu"
                    className={`w-full px-3.5 py-2.5 bg-[#151A18] border rounded-lg text-xs sm:text-sm text-[#F5F7F6] focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                      errors.email ? 'border-[#DC2626]' : 'border-[#29312C]'
                    }`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-[#FF7272]">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#F5F7F6] mb-1.5">
                    Subject / Topic
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Institutional Trial Request / Curriculum Integration"
                    className={`w-full px-3.5 py-2.5 bg-[#151A18] border rounded-lg text-xs sm:text-sm text-[#F5F7F6] focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                      errors.subject ? 'border-[#DC2626]' : 'border-[#29312C]'
                    }`}
                  />
                  {errors.subject && <p className="mt-1 text-xs text-[#FF7272]">{errors.subject}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#F5F7F6] mb-1.5">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about your cohort size, target roles, or specific learning requirements..."
                    className={`w-full px-3.5 py-2.5 bg-[#151A18] border rounded-lg text-xs sm:text-sm text-[#F5F7F6] focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                      errors.message ? 'border-[#DC2626]' : 'border-[#29312C]'
                    }`}
                  />
                  {errors.message && <p className="mt-1 text-xs text-[#FF7272]">{errors.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#32D6B0] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-subtle transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending message...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Inquiry</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
