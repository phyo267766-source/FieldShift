import { useState, useEffect } from 'react';
import { User, Mail, MapPin, Save, Loader2, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const DEFAULT_PROFILE = {
  fullName: '',
  email: '',
  phone: '',
  organization: '',
  role: 'Farmer',
  location: 'Myanmar',
};

export default function Account() {
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState(DEFAULT_PROFILE);

  useEffect(() => {
    const stored = localStorage.getItem('fieldshift_profile');
    if (stored) {
      try {
        setProfile(prev => ({ ...prev, ...JSON.parse(stored) }));
      } catch {}
    }
  }, []);

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem('fieldshift_profile', JSON.stringify(profile));
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 500);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Account</p>
      <h1 className="page-header mt-1">Personal Information</h1>
      <p className="page-subtitle">Manage your profile and preferences.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="section-title mb-6">Profile Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={profile.fullName}
                  onChange={e => handleChange('fullName', e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input-field"
                  value={profile.email}
                  onChange={e => handleChange('email', e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  type="tel"
                  className="input-field"
                  value={profile.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  placeholder="+95"
                />
              </div>
              <div>
                <label className="label">Organization</label>
                <input
                  type="text"
                  className="input-field"
                  value={profile.organization}
                  onChange={e => handleChange('organization', e.target.value)}
                  placeholder="Farm or organization name"
                />
              </div>
              <div>
                <label className="label">Role</label>
                <select
                  className="select-field"
                  value={profile.role}
                  onChange={e => handleChange('role', e.target.value)}
                >
                  <option>Farmer</option>
                  <option>Agricultural Officer</option>
                  <option>Researcher</option>
                  <option>Student</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="label">Country</label>
                <select
                  className="select-field"
                  value={profile.location}
                  onChange={e => handleChange('location', e.target.value)}
                >
                  <option>Myanmar</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : saved ? (
                  <><CheckCircle className="w-4 h-4" /> Saved!</>
                ) : (
                  <><Save className="w-4 h-4" /> Save Profile</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-olive-light dark:bg-brand-800 flex items-center justify-center">
                <User className="w-6 h-6 text-olive dark:text-brand-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{profile.fullName || 'Your Name'}</p>
                <p className="text-xs text-gray-400">{profile.role} • {profile.location}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Profile data is stored locally in your browser. No account or login is required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
