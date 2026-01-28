import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NotebookLayout from '@/components/notebook/NotebookLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, 
  GraduationCap, 
  Target, 
  Code2, 
  Sparkles, 
  Clock, 
  BarChart3,
  Edit3,
  Save,
  X,
  Github,
  Linkedin,
  Globe,
  Trophy,
  Flame,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Plus,
  Trash2,
  Lock,
  AtSign
} from 'lucide-react';
import { 
  getProfile, 
  updateProfile, 
  changePassword,
  updateUsername,
  type ProfileResponse, 
  type UserProfile,
  type AcademicInfo,
  type CareerGoals,
  type CodingProfiles,
  type Skills,
  type StudyPreferences
} from '@/lib/profileApi';
import { useToast } from '@/components/ui/use-toast';

// Emoji picker for avatar
const AVATAR_EMOJIS = ['👨‍💻', '👩‍💻', '🧑‍💻', '👨‍🎓', '👩‍🎓', '🦸', '🦹', '🧙', '🧝', '🎯', '🚀', '💻', '🎨', '📚', '🔥', '⚡', '🌟', '🎪'];

// Study time options
const STUDY_TIMES = [
  { value: 'morning', label: '🌅 Morning Person', desc: '6 AM - 12 PM' },
  { value: 'afternoon', label: '☀️ Afternoon', desc: '12 PM - 6 PM' },
  { value: 'evening', label: '🌆 Evening', desc: '6 PM - 10 PM' },
  { value: 'night', label: '🌙 Night Owl', desc: '10 PM - 2 AM' }
];

export default function PersonalSpace() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ProfileResponse | null>(null);
  
  // Edit mode states for each section
  const [editSection, setEditSection] = useState<string | null>(null);
  
  // Form states
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [academic, setAcademic] = useState<Partial<AcademicInfo>>({});
  const [career, setCareer] = useState<Partial<CareerGoals>>({});
  const [codingProfiles, setCodingProfiles] = useState<Partial<CodingProfiles>>({});
  const [skills, setSkills] = useState<Partial<Skills>>({});
  const [studyPreferences, setStudyPreferences] = useState<Partial<StudyPreferences>>({});
  
  // Password change
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [usernameForm, setUsernameForm] = useState('');
  
  // New item inputs
  const [newCompany, setNewCompany] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newFramework, setNewFramework] = useState('');
  const [newTool, setNewTool] = useState('');
  const [newHobby, setNewHobby] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const result = await getProfile();
      setData(result);
      
      // Initialize form states
      setProfile(result.user.profile || {});
      setAcademic(result.user.academic || {});
      setCareer(result.user.career || {});
      setCodingProfiles(result.user.codingProfiles || {});
      setSkills(result.user.skills || {});
      setStudyPreferences(result.user.studyPreferences || {});
      setUsernameForm(result.user.username);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({ title: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (section: string) => {
    try {
      setSaving(true);
      let updateData: any = {};
      
      switch (section) {
        case 'profile':
          updateData = { profile };
          break;
        case 'academic':
          updateData = { academic };
          break;
        case 'career':
          updateData = { career };
          break;
        case 'codingProfiles':
          updateData = { codingProfiles };
          break;
        case 'skills':
          updateData = { skills };
          break;
        case 'studyPreferences':
          updateData = { studyPreferences };
          break;
      }
      
      const result = await updateProfile(updateData);
      setData(result);
      setEditSection(null);
      toast({ title: 'Profile updated!' });
    } catch (error: any) {
      toast({ title: error?.response?.data?.message || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      toast({ title: 'Passwords do not match' });
      return;
    }
    if (passwordForm.new.length < 6) {
      toast({ title: 'Password must be at least 6 characters' });
      return;
    }
    try {
      setSaving(true);
      await changePassword(passwordForm.current, passwordForm.new);
      setPasswordForm({ current: '', new: '', confirm: '' });
      setEditSection(null);
      toast({ title: 'Password changed successfully!' });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to change password';
      toast({ title: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const handleUsernameChange = async () => {
    if (usernameForm.trim().length < 3) {
      toast({ title: 'Username must be at least 3 characters' });
      return;
    }
    try {
      setSaving(true);
      await updateUsername(usernameForm.trim());
      await fetchProfile();
      setEditSection(null);
      toast({ title: 'Username updated!' });
    } catch (error: any) {
      toast({ title: error?.response?.data?.message || 'Failed to update username' });
    } finally {
      setSaving(false);
    }
  };

  const addToArray = (field: 'targetCompanies' | 'languages' | 'frameworks' | 'tools' | 'hobbies', value: string) => {
    if (!value.trim()) return;
    
    if (field === 'targetCompanies') {
      setCareer(prev => ({
        ...prev,
        targetCompanies: [...(prev.targetCompanies || []), value.trim()]
      }));
      setNewCompany('');
    } else {
      setSkills(prev => ({
        ...prev,
        [field]: [...(prev[field] || []), value.trim()]
      }));
      if (field === 'languages') setNewLanguage('');
      if (field === 'frameworks') setNewFramework('');
      if (field === 'tools') setNewTool('');
      if (field === 'hobbies') setNewHobby('');
    }
  };

  const removeFromArray = (field: 'targetCompanies' | 'languages' | 'frameworks' | 'tools' | 'hobbies', index: number) => {
    if (field === 'targetCompanies') {
      setCareer(prev => ({
        ...prev,
        targetCompanies: (prev.targetCompanies || []).filter((_, i) => i !== index)
      }));
    } else {
      setSkills(prev => ({
        ...prev,
        [field]: (prev[field] || []).filter((_, i) => i !== index)
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="font-hand text-xl text-amber-800">Loading your space...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <p className="font-hand text-xl text-red-600">Failed to load profile</p>
      </div>
    );
  }

  const { user, stats } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <NotebookLayout>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-hand text-4xl text-slate-800 mb-2">Personal Space</h1>
              
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white/80 rounded-lg border-2 border-dashed border-amber-300 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-hand text-xl text-amber-800 flex items-center gap-2">
                  <User className="w-5 h-5" /> Profile
                </h2>
                {editSection !== 'profile' ? (
                  <button onClick={() => setEditSection('profile')} className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-600">
                    <Edit3 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex gap-1">
                    <button onClick={() => handleSave('profile')} disabled={saving} className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200">
                      <Save className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditSection(null)} className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Avatar */}
              <div className="text-center mb-4">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-amber-200 to-orange-200 border-4 border-amber-300 flex items-center justify-center text-5xl shadow-lg">
                  {profile.avatarEmoji || '👨‍💻'}
                </div>
                {editSection === 'profile' && (
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {AVATAR_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => setProfile(prev => ({ ...prev, avatarEmoji: emoji }))}
                        className={`w-8 h-8 rounded-lg text-lg hover:bg-amber-100 transition-colors ${profile.avatarEmoji === emoji ? 'bg-amber-200 ring-2 ring-amber-400' : ''}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {editSection === 'profile' ? (
                <div className="space-y-3">
                  <div>
                    <label className="font-hand text-sm text-slate-600">Display Name</label>
                    <Input 
                      value={profile.displayName || ''} 
                      onChange={e => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
                      placeholder="Your name"
                      className="mt-1 border-amber-200"
                    />
                  </div>
                  <div>
                    <label className="font-hand text-sm text-slate-600">Bio / Tagline</label>
                    <Textarea 
                      value={profile.bio || ''} 
                      onChange={e => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Aspiring Software Engineer 🚀"
                      className="mt-1 border-amber-200 resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="font-hand text-2xl text-slate-800">{profile.displayName || user.username}</h3>
                  <p className="font-hand text-sm text-slate-500">{user.username}</p>
                  {profile.bio && (
                    <p className="font-hand text-base text-slate-600 mt-2 italic">"{profile.bio}"</p>
                  )}
                  <p className="font-hand text-xs text-slate-400 mt-2">{user.email}</p>
                </div>
              )}
            </div>

            {/* Stats Card */}
            <div className="bg-white/80 rounded-lg border-2 border-dashed border-amber-300 p-6">
              <h2 className="font-hand text-xl text-amber-800 flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5" /> Your Stats
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <span className="font-hand text-slate-700">Productivity Score</span>
                  </div>
                  <span className="font-hand text-2xl text-amber-600 font-bold">{stats.productivityScore}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 text-center">
                    <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                    <p className="font-hand text-2xl text-slate-800">{stats.bestStreak}</p>
                    <p className="font-hand text-xs text-slate-500">Best Streak</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-1" />
                    <p className="font-hand text-2xl text-slate-800">{stats.totalCompletions}</p>
                    <p className="font-hand text-xs text-slate-500">Completions</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                    <Calendar className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                    <p className="font-hand text-2xl text-slate-800">{stats.daysActive}</p>
                    <p className="font-hand text-xs text-slate-500">Days Active</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-center">
                    <TrendingUp className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                    <p className="font-hand text-2xl text-slate-800">{stats.avgCompletionRate}%</p>
                    <p className="font-hand text-xs text-slate-500">Avg. Rate</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-dashed border-amber-200">
                  <div className="flex justify-between text-sm">
                    <span className="font-hand text-slate-500">This Week</span>
                    <span className="font-hand text-slate-700">{stats.thisWeekCompletions} completions</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="font-hand text-slate-500">Active Tasks</span>
                    <span className="font-hand text-slate-700">{stats.totalTasks}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="font-hand text-slate-500">Member Since</span>
                    <span className="font-hand text-slate-700">{stats.accountAgeDays} days ago</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-white/80 rounded-lg border-2 border-dashed border-amber-300 p-6">
              <h2 className="font-hand text-xl text-amber-800 flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5" /> Account Settings
              </h2>

              {/* Username */}
              <div className="mb-4 pb-4 border-b border-dashed border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-hand text-sm text-slate-600 flex items-center gap-1"><AtSign className="w-4 h-4" /> Username</span>
                  {editSection !== 'username' ? (
                    <button onClick={() => setEditSection('username')} className="font-hand text-xs text-amber-600 hover:text-amber-800">Edit</button>
                  ) : (
                    <div className="flex gap-1">
                      <button onClick={handleUsernameChange} disabled={saving} className="font-hand text-xs text-green-600 hover:text-green-800">Save</button>
                      <button onClick={() => { setEditSection(null); setUsernameForm(user.username); }} className="font-hand text-xs text-red-600 hover:text-red-800">Cancel</button>
                    </div>
                  )}
                </div>
                {editSection === 'username' ? (
                  <Input 
                    value={usernameForm} 
                    onChange={e => setUsernameForm(e.target.value)}
                    className="border-amber-200"
                  />
                ) : (
                  <p className="font-hand text-slate-800">@{user.username}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-hand text-sm text-slate-600 flex items-center gap-1"><Lock className="w-4 h-4" /> Password</span>
                  {editSection !== 'password' ? (
                    <button onClick={() => setEditSection('password')} className="font-hand text-xs text-amber-600 hover:text-amber-800">Change</button>
                  ) : (
                    <div className="flex gap-1">
                      <button onClick={handlePasswordChange} disabled={saving} className="font-hand text-xs text-green-600 hover:text-green-800">Save</button>
                      <button onClick={() => { setEditSection(null); setPasswordForm({ current: '', new: '', confirm: '' }); }} className="font-hand text-xs text-red-600 hover:text-red-800">Cancel</button>
                    </div>
                  )}
                </div>
                {editSection === 'password' ? (
                  <div className="space-y-2">
                    <Input 
                      type="password"
                      value={passwordForm.current} 
                      onChange={e => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                      placeholder="Current password"
                      className="border-amber-200"
                    />
                    <Input 
                      type="password"
                      value={passwordForm.new} 
                      onChange={e => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                      placeholder="New password"
                      className="border-amber-200"
                    />
                    <Input 
                      type="password"
                      value={passwordForm.confirm} 
                      onChange={e => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                      placeholder="Confirm new password"
                      className="border-amber-200"
                    />
                  </div>
                ) : (
                  <p className="font-hand text-slate-400">••••••••</p>
                )}
              </div>
            </div>
          </div>

          {/* Middle & Right Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Academic Info */}
            <div className="bg-white/80 rounded-lg border-2 border-dashed border-blue-300 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-hand text-xl text-blue-800 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" /> Academic Info
                </h2>
                {editSection !== 'academic' ? (
                  <button onClick={() => setEditSection('academic')} className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600">
                    <Edit3 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex gap-1">
                    <button onClick={() => handleSave('academic')} disabled={saving} className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200">
                      <Save className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditSection(null)} className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {editSection === 'academic' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-hand text-sm text-slate-600">Institution / University</label>
                    <Input 
                      value={academic.institution || ''} 
                      onChange={e => setAcademic(prev => ({ ...prev, institution: e.target.value }))}
                      placeholder="MIT, Stanford..."
                      className="mt-1 border-blue-200"
                    />
                  </div>
                  <div>
                    <label className="font-hand text-sm text-slate-600">Major / Field of Study</label>
                    <Input 
                      value={academic.major || ''} 
                      onChange={e => setAcademic(prev => ({ ...prev, major: e.target.value }))}
                      placeholder="Computer Science"
                      className="mt-1 border-blue-200"
                    />
                  </div>
                  <div>
                    <label className="font-hand text-sm text-slate-600">Year / Semester</label>
                    <Input 
                      value={academic.year || ''} 
                      onChange={e => setAcademic(prev => ({ ...prev, year: e.target.value }))}
                      placeholder="3rd Year, Junior..."
                      className="mt-1 border-blue-200"
                    />
                  </div>
                  <div>
                    <label className="font-hand text-sm text-slate-600">Expected Graduation</label>
                    <Input 
                      value={academic.expectedGraduation || ''} 
                      onChange={e => setAcademic(prev => ({ ...prev, expectedGraduation: e.target.value }))}
                      placeholder="May 2025"
                      className="mt-1 border-blue-200"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="font-hand text-xs text-slate-500">Institution</p>
                    <p className="font-hand text-base text-slate-800">{academic.institution || '—'}</p>
                  </div>
                  <div>
                    <p className="font-hand text-xs text-slate-500">Major</p>
                    <p className="font-hand text-base text-slate-800">{academic.major || '—'}</p>
                  </div>
                  <div>
                    <p className="font-hand text-xs text-slate-500">Year</p>
                    <p className="font-hand text-base text-slate-800">{academic.year || '—'}</p>
                  </div>
                  <div>
                    <p className="font-hand text-xs text-slate-500">Graduation</p>
                    <p className="font-hand text-base text-slate-800">{academic.expectedGraduation || '—'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Career Goals */}
            <div className="bg-white/80 rounded-lg border-2 border-dashed border-purple-300 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-hand text-xl text-purple-800 flex items-center gap-2">
                  <Target className="w-5 h-5" /> Career Goals
                </h2>
                {editSection !== 'career' ? (
                  <button onClick={() => setEditSection('career')} className="p-1.5 rounded-lg hover:bg-purple-100 text-purple-600">
                    <Edit3 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex gap-1">
                    <button onClick={() => handleSave('career')} disabled={saving} className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200">
                      <Save className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditSection(null)} className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {editSection === 'career' ? (
                <div className="space-y-4">
                  <div>
                    <label className="font-hand text-sm text-slate-600">Dream Job / Role</label>
                    <Input 
                      value={career.dreamRole || ''} 
                      onChange={e => setCareer(prev => ({ ...prev, dreamRole: e.target.value }))}
                      placeholder="Senior Software Engineer at Google"
                      className="mt-1 border-purple-200"
                    />
                  </div>
                  <div>
                    <label className="font-hand text-sm text-slate-600">Target Companies</label>
                    <div className="flex gap-2 mt-1">
                      <Input 
                        value={newCompany} 
                        onChange={e => setNewCompany(e.target.value)}
                        placeholder="Add a company"
                        className="border-purple-200"
                        onKeyDown={e => e.key === 'Enter' && addToArray('targetCompanies', newCompany)}
                      />
                      <Button size="sm" onClick={() => addToArray('targetCompanies', newCompany)} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(career.targetCompanies || []).map((company, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-hand">
                          {company}
                          <button onClick={() => removeFromArray('targetCompanies', i)} className="hover:text-red-600"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-hand text-sm text-slate-600">Short-term Goals</label>
                      <Textarea 
                        value={career.shortTermGoals || ''} 
                        onChange={e => setCareer(prev => ({ ...prev, shortTermGoals: e.target.value }))}
                        placeholder="Next 6 months..."
                        className="mt-1 border-purple-200 resize-none"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="font-hand text-sm text-slate-600">Long-term Goals</label>
                      <Textarea 
                        value={career.longTermGoals || ''} 
                        onChange={e => setCareer(prev => ({ ...prev, longTermGoals: e.target.value }))}
                        placeholder="5 year plan..."
                        className="mt-1 border-purple-200 resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="font-hand text-xs text-slate-500">Dream Role</p>
                    <p className="font-hand text-lg text-slate-800">{career.dreamRole || '—'}</p>
                  </div>
                  {(career.targetCompanies || []).length > 0 && (
                    <div>
                      <p className="font-hand text-xs text-slate-500 mb-2">Target Companies</p>
                      <div className="flex flex-wrap gap-2">
                        {(career.targetCompanies || []).map((company, i) => (
                          <span key={i} className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-hand">{company}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-hand text-xs text-slate-500">Short-term</p>
                      <p className="font-hand text-sm text-slate-700">{career.shortTermGoals || '—'}</p>
                    </div>
                    <div>
                      <p className="font-hand text-xs text-slate-500">Long-term</p>
                      <p className="font-hand text-sm text-slate-700">{career.longTermGoals || '—'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Coding Profiles */}
            <div className="bg-white/80 rounded-lg border-2 border-dashed border-green-300 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-hand text-xl text-green-800 flex items-center gap-2">
                  <Code2 className="w-5 h-5" /> Coding Profiles
                </h2>
                {editSection !== 'codingProfiles' ? (
                  <button onClick={() => setEditSection('codingProfiles')} className="p-1.5 rounded-lg hover:bg-green-100 text-green-600">
                    <Edit3 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex gap-1">
                    <button onClick={() => handleSave('codingProfiles')} disabled={saving} className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200">
                      <Save className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditSection(null)} className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {editSection === 'codingProfiles' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-hand text-sm text-slate-600">LeetCode</label>
                    <Input 
                      value={codingProfiles.leetcode || ''} 
                      onChange={e => setCodingProfiles(prev => ({ ...prev, leetcode: e.target.value }))}
                      placeholder="username"
                      className="mt-1 border-green-200"
                    />
                  </div>
                  <div>
                    <label className="font-hand text-sm text-slate-600">Codeforces</label>
                    <Input 
                      value={codingProfiles.codeforces || ''} 
                      onChange={e => setCodingProfiles(prev => ({ ...prev, codeforces: e.target.value }))}
                      placeholder="handle"
                      className="mt-1 border-green-200"
                    />
                  </div>
                  <div>
                    <label className="font-hand text-sm text-slate-600">GitHub</label>
                    <Input 
                      value={codingProfiles.github || ''} 
                      onChange={e => setCodingProfiles(prev => ({ ...prev, github: e.target.value }))}
                      placeholder="username"
                      className="mt-1 border-green-200"
                    />
                  </div>
                  <div>
                    <label className="font-hand text-sm text-slate-600">LinkedIn</label>
                    <Input 
                      value={codingProfiles.linkedin || ''} 
                      onChange={e => setCodingProfiles(prev => ({ ...prev, linkedin: e.target.value }))}
                      placeholder="URL or username"
                      className="mt-1 border-green-200"
                    />
                  </div>
                  <div>
                    <label className="font-hand text-sm text-slate-600">Portfolio</label>
                    <Input 
                      value={codingProfiles.portfolio || ''} 
                      onChange={e => setCodingProfiles(prev => ({ ...prev, portfolio: e.target.value }))}
                      placeholder="https://yoursite.com"
                      className="mt-1 border-green-200"
                    />
                  </div>
                  <div>
                    <label className="font-hand text-sm text-slate-600">Twitter / X</label>
                    <Input 
                      value={codingProfiles.twitter || ''} 
                      onChange={e => setCodingProfiles(prev => ({ ...prev, twitter: e.target.value }))}
                      placeholder="@handle"
                      className="mt-1 border-green-200"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {codingProfiles.leetcode && (
                    <a href={`https://leetcode.com/u/${codingProfiles.leetcode}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors">
                      <span className="text-lg">🧡</span>
                      <span className="font-hand text-sm text-slate-700">LeetCode</span>
                    </a>
                  )}
                  {codingProfiles.codeforces && (
                    <a href={`https://codeforces.com/profile/${codingProfiles.codeforces}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors">
                      <span className="text-lg">💙</span>
                      <span className="font-hand text-sm text-slate-700">Codeforces</span>
                    </a>
                  )}
                  {codingProfiles.github && (
                    <a href={`https://github.com/${codingProfiles.github}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors">
                      <Github className="w-4 h-4" />
                      <span className="font-hand text-sm text-slate-700">GitHub</span>
                    </a>
                  )}
                  {codingProfiles.linkedin && (
                    <a href={codingProfiles.linkedin.startsWith('http') ? codingProfiles.linkedin : `https://linkedin.com/in/${codingProfiles.linkedin}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors">
                      <Linkedin className="w-4 h-4 text-blue-600" />
                      <span className="font-hand text-sm text-slate-700">LinkedIn</span>
                    </a>
                  )}
                  {codingProfiles.portfolio && (
                    <a href={codingProfiles.portfolio} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors">
                      <Globe className="w-4 h-4 text-purple-600" />
                      <span className="font-hand text-sm text-slate-700">Portfolio</span>
                    </a>
                  )}
                  {codingProfiles.twitter && (
                    <a href={`https://twitter.com/${codingProfiles.twitter.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors">
                      <span className="text-lg">𝕏</span>
                      <span className="font-hand text-sm text-slate-700">Twitter</span>
                    </a>
                  )}
                  {!codingProfiles.leetcode && !codingProfiles.codeforces && !codingProfiles.github && !codingProfiles.linkedin && !codingProfiles.portfolio && !codingProfiles.twitter && (
                    <p className="font-hand text-slate-400 col-span-full">No profiles added yet. Click edit to add your links!</p>
                  )}
                </div>
              )}
            </div>

            {/* Skills & Interests */}
            <div className="bg-white/80 rounded-lg border-2 border-dashed border-pink-300 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-hand text-xl text-pink-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> Skills & Interests
                </h2>
                {editSection !== 'skills' ? (
                  <button onClick={() => setEditSection('skills')} className="p-1.5 rounded-lg hover:bg-pink-100 text-pink-600">
                    <Edit3 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex gap-1">
                    <button onClick={() => handleSave('skills')} disabled={saving} className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200">
                      <Save className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditSection(null)} className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {editSection === 'skills' ? (
                <div className="space-y-4">
                  {/* Languages */}
                  <div>
                    <label className="font-hand text-sm text-slate-600">Programming Languages</label>
                    <div className="flex gap-2 mt-1">
                      <Input 
                        value={newLanguage} 
                        onChange={e => setNewLanguage(e.target.value)}
                        placeholder="Python, JavaScript..."
                        className="border-pink-200"
                        onKeyDown={e => e.key === 'Enter' && addToArray('languages', newLanguage)}
                      />
                      <Button size="sm" onClick={() => addToArray('languages', newLanguage)} className="bg-pink-600 hover:bg-pink-700">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(skills.languages || []).map((lang, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-hand">
                          {lang}
                          <button onClick={() => removeFromArray('languages', i)} className="hover:text-red-600"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Frameworks */}
                  <div>
                    <label className="font-hand text-sm text-slate-600">Frameworks & Technologies</label>
                    <div className="flex gap-2 mt-1">
                      <Input 
                        value={newFramework} 
                        onChange={e => setNewFramework(e.target.value)}
                        placeholder="React, Node.js..."
                        className="border-pink-200"
                        onKeyDown={e => e.key === 'Enter' && addToArray('frameworks', newFramework)}
                      />
                      <Button size="sm" onClick={() => addToArray('frameworks', newFramework)} className="bg-pink-600 hover:bg-pink-700">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(skills.frameworks || []).map((fw, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-sm font-hand">
                          {fw}
                          <button onClick={() => removeFromArray('frameworks', i)} className="hover:text-red-600"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Tools */}
                  <div>
                    <label className="font-hand text-sm text-slate-600">Tools & Platforms</label>
                    <div className="flex gap-2 mt-1">
                      <Input 
                        value={newTool} 
                        onChange={e => setNewTool(e.target.value)}
                        placeholder="Git, Docker, AWS..."
                        className="border-pink-200"
                        onKeyDown={e => e.key === 'Enter' && addToArray('tools', newTool)}
                      />
                      <Button size="sm" onClick={() => addToArray('tools', newTool)} className="bg-pink-600 hover:bg-pink-700">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(skills.tools || []).map((tool, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-hand">
                          {tool}
                          <button onClick={() => removeFromArray('tools', i)} className="hover:text-red-600"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Hobbies */}
                  <div>
                    <label className="font-hand text-sm text-slate-600">Hobbies & Interests</label>
                    <div className="flex gap-2 mt-1">
                      <Input 
                        value={newHobby} 
                        onChange={e => setNewHobby(e.target.value)}
                        placeholder="Gaming, Music..."
                        className="border-pink-200"
                        onKeyDown={e => e.key === 'Enter' && addToArray('hobbies', newHobby)}
                      />
                      <Button size="sm" onClick={() => addToArray('hobbies', newHobby)} className="bg-pink-600 hover:bg-pink-700">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(skills.hobbies || []).map((hobby, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-hand">
                          {hobby}
                          <button onClick={() => removeFromArray('hobbies', i)} className="hover:text-red-600"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {(skills.languages || []).length > 0 && (
                    <div>
                      <p className="font-hand text-xs text-slate-500 mb-2">Languages</p>
                      <div className="flex flex-wrap gap-2">
                        {(skills.languages || []).map((lang, i) => (
                          <span key={i} className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-hand">{lang}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(skills.frameworks || []).length > 0 && (
                    <div>
                      <p className="font-hand text-xs text-slate-500 mb-2">Frameworks</p>
                      <div className="flex flex-wrap gap-2">
                        {(skills.frameworks || []).map((fw, i) => (
                          <span key={i} className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-hand">{fw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(skills.tools || []).length > 0 && (
                    <div>
                      <p className="font-hand text-xs text-slate-500 mb-2">Tools</p>
                      <div className="flex flex-wrap gap-2">
                        {(skills.tools || []).map((tool, i) => (
                          <span key={i} className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-hand">{tool}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(skills.hobbies || []).length > 0 && (
                    <div>
                      <p className="font-hand text-xs text-slate-500 mb-2">Hobbies</p>
                      <div className="flex flex-wrap gap-2">
                        {(skills.hobbies || []).map((hobby, i) => (
                          <span key={i} className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-hand">{hobby}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {!(skills.languages || []).length && !(skills.frameworks || []).length && !(skills.tools || []).length && !(skills.hobbies || []).length && (
                    <p className="font-hand text-slate-400">No skills added yet. Click edit to add your skills!</p>
                  )}
                </div>
              )}
            </div>

            {/* Study Preferences */}
            <div className="bg-white/80 rounded-lg border-2 border-dashed border-cyan-300 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-hand text-xl text-cyan-800 flex items-center gap-2">
                  <Clock className="w-5 h-5" /> Study Preferences
                </h2>
                {editSection !== 'studyPreferences' ? (
                  <button onClick={() => setEditSection('studyPreferences')} className="p-1.5 rounded-lg hover:bg-cyan-100 text-cyan-600">
                    <Edit3 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex gap-1">
                    <button onClick={() => handleSave('studyPreferences')} disabled={saving} className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200">
                      <Save className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditSection(null)} className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {editSection === 'studyPreferences' ? (
                <div className="space-y-4">
                  <div>
                    <label className="font-hand text-sm text-slate-600 mb-2 block">Preferred Study Time</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {STUDY_TIMES.map(time => (
                        <button
                          key={time.value}
                          onClick={() => setStudyPreferences(prev => ({ ...prev, preferredTime: time.value as any }))}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${studyPreferences.preferredTime === time.value ? 'border-cyan-400 bg-cyan-50' : 'border-gray-200 hover:border-cyan-200'}`}
                        >
                          <p className="font-hand text-base">{time.label}</p>
                          <p className="font-hand text-xs text-slate-500">{time.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="font-hand text-sm text-slate-600">Daily Study Goal (hours)</label>
                    <Input 
                      type="number"
                      min={1}
                      max={24}
                      value={studyPreferences.dailyGoalHours || 4} 
                      onChange={e => setStudyPreferences(prev => ({ ...prev, dailyGoalHours: Number(e.target.value) }))}
                      className="mt-1 border-cyan-200 w-32"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    <p className="font-hand text-xs text-slate-500">Preferred Time</p>
                    <p className="font-hand text-lg text-slate-800">
                      {STUDY_TIMES.find(t => t.value === studyPreferences.preferredTime)?.label || '🌅 Morning Person'}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="font-hand text-xs text-slate-500">Daily Goal</p>
                    <p className="font-hand text-lg text-slate-800">{studyPreferences.dailyGoalHours || 4} hours</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </NotebookLayout>
    </div>
  );
}
