import React, { useState, useEffect } from 'react';
import { FiSettings, FiGlobe, FiMail, FiDroplet, FiImage, FiSave, FiCheck } from 'react-icons/fi';
import useThemeStore, { API_BASE } from '../../store/themeStore';
import { getSettings, updateSettings, getSMTPSettings, updateSMTPSettings } from '../../services/settingService.js';
import { uploadThemeAsset } from '../../services/themeService.js';

const TABS = [
  { id: 'general', label: 'General', icon: FiGlobe },
  { id: 'smtp', label: 'SMTP', icon: FiMail },
  { id: 'theme', label: 'Theme', icon: FiDroplet },
  { id: 'logo', label: 'Logo & Brand', icon: FiImage },
];

const FONTS = ['Poppins, sans-serif', 'Inter, sans-serif', 'Roboto, sans-serif', 'Nunito, sans-serif', 'Montserrat, sans-serif', 'Lato, sans-serif'];
const COLOR_FIELDS = [['primaryColor', 'Primary'], ['secondaryColor', 'Secondary'], ['accentColor', 'Accent'], ['sidebarColor', 'Sidebar'], ['headerColor', 'Header'], ['buttonColor', 'Button']];

const assetUrl = (p) => { if (!p) return ''; if (p.startsWith('http')) return p; if (p.startsWith('/uploads')) return `${API_BASE}${p}`; return p; };

export default function SettingsPage() {
  const { theme, setThemeLocal, persistTheme, saving } = useThemeStore();
  const [tab, setTab] = useState('general');
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState('');
  const [generalForm, setGeneralForm] = useState({ libraryName: '', address: '', email: '', mobile: '', gstNumber: '', website: '', supportEmail: '' });
  const [smtpForm, setSmtpForm] = useState({ host: '', port: 587, user: '', pass: '', from: '', enabled: false });
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [g, s] = await Promise.all([getSettings(), getSMTPSettings()]);
        setGeneralForm(g); setSmtpForm(s);
      } catch (e) { console.error(e); }
      setLoadingData(false);
    })();
  }, []);

  const saveGeneral = async () => {
    setMsg('');
    try { await updateSettings(generalForm); setMsg('General settings saved!'); } catch (e) { setMsg(e.message); }
  };

  const saveSMTP = async () => {
    setMsg('');
    try { await updateSMTPSettings(smtpForm); setMsg('SMTP settings saved!'); } catch (e) { setMsg(e.message); }
  };

  const saveTheme = async () => {
    setMsg('');
    try { await persistTheme(theme); setMsg('Theme saved!'); } catch (e) { setMsg('Save failed'); }
  };

  const onUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(type);
    try { const { url } = await uploadThemeAsset(file, type); setThemeLocal({ [type]: url }); setMsg(`${type} uploaded!`); } catch (err) { setMsg('Upload failed'); }
    setUploading(''); e.target.value = '';
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-[var(--primary)]/10 p-3"><FiSettings size={24} className="text-[var(--primary)]" /></div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
          <p className="text-sm text-[var(--text-muted)]">System configuration</p>
        </div>
      </div>

      {msg && <div className={`rounded-xl px-4 py-3 text-sm ${msg.includes('fail') ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>{msg}</div>}

      <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1 overflow-x-auto">
        {TABS.map(t => <button key={t.id} onClick={() => { setTab(t.id); setMsg(''); }} className={`flex items-center gap-1.5 flex-shrink-0 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${tab === t.id ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}><t.icon size={14} /> {t.label}</button>)}
      </div>

      {loadingData ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" /></div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">

          {/* GENERAL */}
          {tab === 'general' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">General Settings</h2>
              {[
                ['libraryName', 'Library Name', 'text'],
                ['address', 'Address', 'text'],
                ['email', 'Email', 'email'],
                ['mobile', 'Mobile', 'tel'],
                ['gstNumber', 'GST Number', 'text'],
                ['website', 'Website', 'url'],
                ['supportEmail', 'Support Email', 'email'],
              ].map(([key, label, type]) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">{label}</label>
                  <input type={type} value={generalForm[key] || ''} onChange={e => setGeneralForm({ ...generalForm, [key]: e.target.value })} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--primary)] outline-none" />
                </div>
              ))}
              <button onClick={saveGeneral} className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"><FiSave size={14} /> Save</button>
            </div>
          )}

          {/* SMTP */}
          {tab === 'smtp' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">SMTP Settings</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={smtpForm.enabled} onChange={e => setSmtpForm({ ...smtpForm, enabled: e.target.checked })} className="rounded" />
                <span className="text-sm text-[var(--text-primary)]">Enable SMTP</span>
              </label>
              {[
                ['host', 'SMTP Host'], ['port', 'SMTP Port'], ['user', 'Username'],
                ['pass', 'Password'], ['from', 'From Email'],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">{label}</label>
                  <input type={key === 'pass' ? 'password' : key === 'port' ? 'number' : 'text'} value={smtpForm[key] || ''} onChange={e => setSmtpForm({ ...smtpForm, [key]: key === 'port' ? Number(e.target.value) : e.target.value })} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--primary)] outline-none" />
                </div>
              ))}
              <button onClick={saveSMTP} className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"><FiSave size={14} /> Save SMTP</button>
            </div>
          )}

          {/* THEME */}
          {tab === 'theme' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Theme Settings</h2>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">Library Name</label>
                <input value={theme.libraryName || ''} onChange={e => setThemeLocal({ libraryName: e.target.value })} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">Font Family</label>
                <select value={theme.fontFamily || ''} onChange={e => setThemeLocal({ fontFamily: e.target.value })} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)]">
                  {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {COLOR_FIELDS.map(([key, label]) => (
                  <div key={key}>
                    <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">{label}</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={theme[key] || '#000000'} onChange={e => setThemeLocal({ [key]: e.target.value })} className="h-10 w-14 cursor-pointer rounded" />
                      <input value={theme[key] || ''} onChange={e => setThemeLocal({ [key]: e.target.value })} className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-xs text-[var(--text-primary)]" />
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={saveTheme} className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"><FiSave size={14} /> Save Theme</button>
            </div>
          )}

          {/* LOGO */}
          {tab === 'logo' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Logo & Brand</h2>
              {['logo', 'favicon'].map(type => (
                <div key={type} className="rounded-xl border border-[var(--border)] p-4">
                  <label className="mb-2 block text-xs font-semibold text-[var(--text-secondary)] capitalize">{type}</label>
                  <div className="flex items-center gap-4">
                    <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-xl border bg-[var(--bg-secondary)]">
                      {theme[type] ? <img src={assetUrl(theme[type])} alt={type} className="h-full w-full object-contain p-1" /> : <FiImage size={20} className="text-[var(--text-muted)] opacity-40" />}
                    </div>
                    <div>
                      <input type="file" accept="image/*" onChange={e => onUpload(e, type)} className="text-xs" />
                      {uploading === type && <p className="mt-1 text-[10px] text-[var(--primary)]">Uploading...</p>}
                      <p className="mt-1 text-[10px] text-[var(--text-muted)]">Recommended: 512x512px PNG</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
