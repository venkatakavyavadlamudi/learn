import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { authService } from '../services/authService';
import { User, StudentProfile } from '../types';
import { DEFAULT_PROFILE } from '../data/sampleStudentData';
import { supabase } from '../services/supabaseClient';
import {
  User as UserIcon,
  Mail,
  Phone,
  GraduationCap,
  Target,
  CheckCircle2,
  Save,
  Plus,
  X,
  ArrowLeft,
  Building,
  ShieldCheck,
  Award,
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { navigate } = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [profile, setProfile] = useState<StudentProfile>(DEFAULT_PROFILE);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [careerGoal, setCareerGoal] = useState('Data Analyst');
  const [newSkillInput, setNewSkillInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [supportTeam, setSupportTeam] = useState<{ trainer?: any; mentor?: any } | null>(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }
    
    setCurrentUser(user);
    setName(user.name);
    setPhone(user.phone || '');
    const existingProfile = authService.getProfile(user.id);
    setProfile(existingProfile);

    // Fetch support team if student
    const roleNormalized = String(user.role || '').toLowerCase();
    if (roleNormalized === 'student') {
      const fetchSupport = async () => {
        if (!supabase) return;
        try {
          const { data: stu } = await supabase
            .from('students')
            .select('trainer_id, mentor_id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (stu) {
            const team: any = {};
            if (stu.trainer_id) {
              const { data: trn } = await supabase.from('trainers').select('*').eq('trainer_id', stu.trainer_id).maybeSingle();
              team.trainer = trn;
            }
            if (stu.mentor_id) {
              const { data: men } = await supabase.from('mentors').select('*').eq('mentor_id', stu.mentor_id).maybeSingle();
              team.mentor = men;
            }
            setSupportTeam(team);
          }
        } catch (err) {
          console.warn('Failed to fetch support team in profile', err);
        }
      };
      fetchSupport();
    }
  }, [navigate]);

  if (!currentUser) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser) {
      if (name.trim() && name !== currentUser.name) {
        authService.updateUserName(currentUser.id, name.trim());
      }
      authService.updateProfile(currentUser.id, {
        ...profile,
        targetRole: careerGoal,
      });
      setToastMessage('✓ Profile updated successfully.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleAddSkill = () => {
    const skill = newSkillInput.trim();
    if (!skill) return;
    if (!profile.skills.includes(skill)) {
      setProfile((prev) => ({
        ...prev,
        skills: [...prev.skills, skill],
      }));
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const roleNormalized = String(currentUser.role || '').toLowerCase();
  const roleLabel =
    roleNormalized === 'admin' || roleNormalized === 'institution_admin' || roleNormalized === 'institution admin'
      ? 'Institution Admin'
      : roleNormalized === 'mentor'
      ? 'Mentor'
      : roleNormalized === 'trainer'
      ? 'Trainer'
      : currentUser.Organization_ID
      ? 'Student'
      : 'Student';

  const orgLabel = currentUser.organizationName
    ? currentUser.organizationName
    : currentUser.Organization_ID
    ? currentUser.Organization_ID
    : null;

  const isStudent = roleNormalized === 'student';

  return (
    <div className="bg-[#0A0D0C] text-[#F5F7F6] min-h-screen py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#32D6B0] hover:underline mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl font-bold text-[#F5F7F6] tracking-tight">
              User Profile
            </h1>
            <p className="text-xs sm:text-sm text-[#A3ADA7]">
              Manage your personal credentials, skills, and target career goals.
            </p>
          </div>

          {toastMessage && (
            <div className="bg-[#1B211E] text-[#78D98A] border border-[#BBF7D0] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-[#78D98A]" />
              <span>{toastMessage}</span>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-[#151A18] rounded-2xl border border-[#29312C] shadow-card overflow-hidden">
          {/* Header Banner with Avatar */}
          <div className="p-6 sm:p-8 border-b border-[#29312C] bg-[#0A0D0C] flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-[#32D6B0] text-white flex items-center justify-center font-bold text-2xl shadow-subtle shrink-0">
              {currentUser.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2) || 'US'}
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#F5F7F6]">{currentUser.name}</h2>
              <p className="text-xs text-[#A3ADA7]">{currentUser.email}</p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#1B211E] text-[#32D6B0] border border-[#29312C]">
                  {roleLabel}
                </span>
                {orgLabel && (
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-[#151A18] text-[#A3ADA7] border border-[#29312C]">
                    {orgLabel}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-[#F5F7F6] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A3ADA7]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#151A18] border border-[#29312C] rounded-lg text-xs sm:text-sm text-[#F5F7F6] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              {/* Email (Readonly) */}
              <div>
                <label className="block text-xs font-semibold text-[#F5F7F6] mb-1.5">
                  Email Address (Primary Login)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="email"
                    disabled
                    value={currentUser.email}
                    className="w-full pl-9 pr-3 py-2 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-xs sm:text-sm text-[#A3ADA7] cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-[#F5F7F6] mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A3ADA7]" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 bg-[#151A18] border border-[#29312C] rounded-lg text-xs sm:text-sm text-[#F5F7F6] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              {/* Career Goal */}
              <div>
                <label className="block text-xs font-semibold text-[#F5F7F6] mb-1.5">
                  Target Career Goal
                </label>
                <div className="relative">
                  <Target className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A3ADA7]" />
                  <input
                    type="text"
                    value={careerGoal}
                    onChange={(e) => setCareerGoal(e.target.value)}
                    placeholder="e.g. Data Analyst"
                    className="w-full pl-9 pr-3 py-2 bg-[#151A18] border border-[#29312C] rounded-lg text-xs sm:text-sm text-[#F5F7F6] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              {/* Role (Protected: Non-editable) */}
              <div>
                <label className="block text-xs font-semibold text-[#F5F7F6] mb-1.5">
                  System Role (Authority Controlled)
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="text"
                    disabled
                    value={roleLabel}
                    className="w-full pl-9 pr-3 py-2 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-xs sm:text-sm text-[#A3ADA7] cursor-not-allowed font-semibold"
                  />
                </div>
                <p className="mt-1 text-[11px] text-[#A3ADA7]">
                  Role can only be promoted or modified by an administrator.
                </p>
              </div>

              {/* Organization (Protected: Non-editable) */}
              <div>
                <label className="block text-xs font-semibold text-[#F5F7F6] mb-1.5">
                  Institution Affiliation
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="text"
                    disabled
                    value={orgLabel || 'Independent'}
                    className="w-full pl-9 pr-3 py-2 bg-[#0A0D0C] border border-[#29312C] rounded-lg text-xs sm:text-sm text-[#A3ADA7] cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-[11px] text-[#A3ADA7]">
                  Institution binding is managed by your college or platform admin.
                </p>
              </div>
            </div>

            {/* Skills Tag Management */}
            <div className="pt-4 border-t border-[#29312C] space-y-3">
              <label className="block text-xs font-semibold text-[#F5F7F6]">
                Verified Skills & Competencies
              </label>

              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-[#1B211E] text-[#32D6B0] border border-[#29312C]"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-[#32D6B0] hover:text-[#FF7272]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 max-w-md pt-1">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  placeholder="Add skill (e.g. Pandas, Docker)..."
                  className="flex-1 px-3 py-1.5 bg-[#151A18] border border-[#29312C] rounded-lg text-xs text-[#F5F7F6] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-3.5 py-1.5 bg-[#1B211E] text-[#32D6B0] hover:bg-[#DBEAFE] rounded-lg text-xs font-semibold border border-[#29312C] transition-colors"
                >
                  Add Skill
                </button>
              </div>
            </div>

            {/* Support Team (For Students Only) */}
            {isStudent && (
              <div className="pt-6 border-t border-[#29312C] space-y-4">
                <div className="flex items-center gap-2 pb-1">
                  <ShieldCheck className="w-4 h-4 text-[#32D6B0]" />
                  <h3 className="text-sm font-bold text-[#F5F7F6]">My Dedicated Support Team</h3>
                </div>
                <p className="text-[11px] text-[#A3ADA7] leading-relaxed">
                  Your institution has allocated specific faculty members to guide your technical training and career development.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Trainer */}
                  <div className="p-4 rounded-xl bg-[#0A0D0C] border border-[#29312C] flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#32D6B0]/10 flex items-center justify-center shrink-0 border border-[#32D6B0]/20">
                      <GraduationCap className="w-5 h-5 text-[#32D6B0]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-[#A3ADA7] uppercase font-bold tracking-wider mb-0.5">Primary Trainer</p>
                      <p className="text-sm font-bold text-[#F5F7F6] truncate">
                        {supportTeam?.trainer?.full_name || 'Assignment Pending'}
                      </p>
                      {supportTeam?.trainer && (
                        <p className="text-[11px] text-[#32D6B0] truncate mt-0.5 font-medium">
                          {supportTeam.trainer.specialization}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Mentor */}
                  <div className="p-4 rounded-xl bg-[#0A0D0C] border border-[#29312C] flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#B4E85A]/10 flex items-center justify-center shrink-0 border border-[#B4E85A]/20">
                      <Award className="w-5 h-5 text-[#B4E85A]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-[#A3ADA7] uppercase font-bold tracking-wider mb-0.5">Career Mentor</p>
                      <p className="text-sm font-bold text-[#F5F7F6] truncate">
                        {supportTeam?.mentor?.full_name || 'Assignment Pending'}
                      </p>
                      {supportTeam?.mentor && (
                        <p className="text-[11px] text-[#B4E85A] truncate mt-0.5 font-medium">
                          {supportTeam.mentor.specialization}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-4 border-t border-[#29312C] flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#32D6B0] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-subtle transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
