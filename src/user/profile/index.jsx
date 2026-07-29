import React, { useEffect, useState, useRef } from 'react';
import { getProfile, updateProfile, uploadProfileImage } from '../../services/profileService';
import useAuthStore from '../../store/authStore';
import { FiUser, FiMail, FiPhone, FiCheck, FiCamera, FiGrid, FiMapPin, FiCreditCard, FiCalendar, FiRefreshCw } from 'react-icons/fi';

const UserProfilePage = () => {
  const { user: storeUser, login } = useAuthStore();
  const fileRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('profile');

  const [form, setForm] = useState({ name: '', email: '', mobile: '', address: '', aadhaarNumber: '' });

  useEffect(() => {
    getProfile().then(d => {
      setProfile(d.user);
      setMember(d.member);
      setForm({
        name: d.user.name || '',
        email: d.user.email || '',
        mobile: d.user.mobile || '',
        address: d.member?.address || '',
        aadhaarNumber: d.member?.aadhaarNumber || '',
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const { profileImage } = await uploadProfileImage(file);
      const updated = { ...profile, profileImage };
      setProfile(updated);
      login({ ...storeUser, profileImage }, localStorage.getItem('accessToken'));
      setSuccess('Photo updated');
    } catch (e) { setError(e.response?.data?.message || 'Upload failed'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      await updateProfile(form);
      const d = await getProfile();
      setProfile(d.user);
      setMember(d.member);
      login({ ...storeUser, name: d.user.name, email: d.user.email, mobile: d.user.mobile, profileImage: d.user.profileImage }, localStorage.getItem('accessToken'));
      setSuccess('Profile updated successfully');
    } catch (e) { setError(e.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  const field = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white';
  const label = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300';

  if (loading) return <div className="py-16 text-center text-slate-400">Loading...</div>;

  const photo = profile?.profileImage || `https://ui-avatars.com/api/?background=FFF0E6&color=FF6B00&name=${encodeURIComponent(profile?.name || 'U')}&size=128`;
  const daysLeft = member ? Math.max(Math.ceil((new Date(member.membershipExpiryDate) - new Date()) / 86400000), 0) : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-5">
        <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
          <img src={photo} alt="" className="h-24 w-24 rounded-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition group-hover:opacity-100">
            <FiCamera className="text-xl text-white" />
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{profile?.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{profile?.role} · {profile?.mobile}</p>
          {member?.seatId && (
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
              Seat: {member.seatId.seatNumber} · {member.shiftId?.shiftName || 'No shift'}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {['profile', 'membership'].map(t => (
          <button key={t} onClick={() => { setTab(t); setError(''); setSuccess(''); }} className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition ${tab === t ? 'bg-white text-orange-600 shadow dark:bg-slate-700 dark:text-orange-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>{t}</button>
        ))}
      </div>

      {success && <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400 flex items-center gap-2"><FiCheck /> {success}</div>}
      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>}

      {tab === 'profile' && (
        <form onSubmit={handleUpdate} className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Personal Information</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={label}>Full Name</label>
              <div className="relative"><FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className={`${field} pl-10`} />
              </div>
            </div>
            <div>
              <label className={label}>Email</label>
              <div className="relative"><FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={`${field} pl-10`} />
              </div>
            </div>
            <div>
              <label className={label}>Mobile</label>
              <div className="relative"><FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} className={`${field} pl-10`} />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Address</label>
              <div className="relative"><FiMapPin className="absolute left-3 top-3 text-slate-400" />
                <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} className={`${field} pl-10`} />
              </div>
            </div>
            <div>
              <label className={label}>Aadhaar Number</label>
              <div className="relative"><FiCreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={form.aadhaarNumber} onChange={e => setForm({ ...form, aadhaarNumber: e.target.value })} className={`${field} pl-10`} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving} className="rounded-xl bg-[var(--button)] px-6 py-2.5 font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>
      )}

      {tab === 'membership' && member && (
        <div className="space-y-4">
          <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800">
            <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">Seat & Shift</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-orange-50 p-4 dark:bg-orange-900/20">
                <p className="text-xs text-slate-500">Seat Number</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{member.seatId?.seatNumber || 'Unassigned'}</p>
                {member.seatId?.floor && <p className="text-xs text-slate-400">Floor {member.seatId.floor}</p>}
              </div>
              <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
                <p className="text-xs text-slate-500">Shift</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{member.shiftId?.shiftName || 'Unassigned'}</p>
                {member.shiftId?.startTime && <p className="text-xs text-slate-400">{member.shiftId.startTime} - {member.shiftId.endTime}</p>}
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800">
            <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">Membership</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-green-50 p-4 dark:bg-green-900/20">
                <p className="text-xs text-slate-500">Plan</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{member.membershipPlan}</p>
              </div>
              <div className="rounded-xl bg-yellow-50 p-4 dark:bg-yellow-900/20">
                <p className="text-xs text-slate-500">Expiry Date</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">
                  {member.membershipExpiryDate ? new Date(member.membershipExpiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                </p>
              </div>
              <div className={`rounded-xl p-4 ${daysLeft <= 7 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-purple-50 dark:bg-purple-900/20'}`}>
                <p className="text-xs text-slate-500">Days Remaining</p>
                <p className={`text-xl font-bold ${daysLeft <= 7 ? 'text-red-600' : 'text-slate-800 dark:text-white'}`}>{daysLeft}</p>
              </div>
            </div>
          </section>
        </div>
      )}

      {tab === 'membership' && !member && (
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800 text-center py-12 text-slate-400">
          No membership data found.
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;
