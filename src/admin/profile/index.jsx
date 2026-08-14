import React, { useEffect, useState, useRef } from 'react';
import { getProfile, updateProfile, changePassword, uploadProfileImage } from '../../services/profileService';
import useAuthStore from '../../store/authStore';
import { FiUser, FiMail, FiPhone, FiLock, FiCheck, FiCamera, FiEye, FiEyeOff } from 'react-icons/fi';
import { getPhotoUrl } from '../../utils/image';

const AdminProfilePage = () => {
  const { user: storeUser, login } = useAuthStore();
  const fileRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({ name: '', email: '', mobile: '' });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    getProfile().then(d => {
      setProfile(d.user);
      setForm({ name: d.user.name || '', email: d.user.email || '', mobile: d.user.mobile || '' });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await uploadProfileImage(file);
      const newImg = res.profileImage || res.photo || res.user?.profileImage;
      const updated = { ...profile, profileImage: newImg };
      setProfile(updated);
      login({ ...storeUser, profileImage: newImg }, localStorage.getItem('accessToken'));
      setSuccess('Photo updated successfully');
    } catch (e) { setError(e.response?.data?.message || 'Upload failed'); }
    finally { setSaving(false); }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const updated = await updateProfile({ email: form.email, mobile: form.mobile });
      setProfile(updated);
      login({ ...storeUser, ...updated }, localStorage.getItem('accessToken'));
      setSuccess('Profile updated successfully');
    } catch (e) { setError(e.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) { setError('Passwords do not match'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      await changePassword(pwdForm.currentPassword, pwdForm.newPassword);
      setSuccess('Password changed successfully');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) { setError(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const field = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white';

  if (loading) return <div className="py-16 text-center text-slate-400">Loading...</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
          <UserAvatar src={profile?.profileImage} name={profile?.name || 'A'} className="h-20 w-20 rounded-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition group-hover:opacity-100">
            <FiCamera className="text-xl text-white" />
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{profile?.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{profile?.role} · {profile?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {['profile', 'password'].map(t => (
          <button key={t} onClick={() => { setTab(t); setError(''); setSuccess(''); }} className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition ${tab === t ? 'bg-white text-orange-600 shadow dark:bg-slate-700 dark:text-orange-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>{t}</button>
        ))}
      </div>

      {success && <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400 flex items-center gap-2"><FiCheck /> {success}</div>}
      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>}

      {tab === 'profile' && (
        <form onSubmit={handleProfileUpdate} className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Profile Information</h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={form.name} disabled className={`${field} pl-10 opacity-60 cursor-not-allowed`} />
            </div>
            <p className="mt-1 text-xs text-slate-400">Contact admin to change your name</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={`${field} pl-10`} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Mobile</label>
            <div className="relative">
              <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} className={`${field} pl-10`} />
            </div>
          </div>
          <button type="submit" disabled={saving} className="rounded-xl bg-[var(--button)] px-6 py-2.5 font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>
      )}

      {tab === 'password' && (
        <form onSubmit={handlePasswordChange} className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Change Password</h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Current Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type={showCurrentPassword ? 'text' : 'password'} value={pwdForm.currentPassword} onChange={e => setPwdForm({ ...pwdForm, currentPassword: e.target.value })} required className={`${field} pl-10 pr-10`} />
              <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><>{showCurrentPassword ? <FiEyeOff /> : <FiEye />}</></button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type={showNewPassword ? 'text' : 'password'} value={pwdForm.newPassword} onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })} required minLength={8} className={`${field} pl-10 pr-10`} />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><>{showNewPassword ? <FiEyeOff /> : <FiEye />}</></button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm New Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type={showConfirmPassword ? 'text' : 'password'} value={pwdForm.confirmPassword} onChange={e => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })} required minLength={8} className={`${field} pl-10 pr-10`} />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><>{showConfirmPassword ? <FiEyeOff /> : <FiEye />}</></button>
            </div>
          </div>
          <button type="submit" disabled={saving} className="rounded-xl bg-red-500 px-6 py-2.5 font-semibold text-white hover:bg-red-600 disabled:opacity-60">{saving ? 'Changing...' : 'Change Password'}</button>
        </form>
      )}
    </div>
  );
};

export default AdminProfilePage;
