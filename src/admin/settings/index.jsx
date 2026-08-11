import React, { useState, useEffect } from 'react';
import { FiGlobe, FiClock, FiUsers, FiFileText, FiMail, FiSave, FiImage, FiCheck, FiCreditCard } from 'react-icons/fi';
import useThemeStore, { API_BASE } from '../../store/themeStore';
import {
  getSettings, updateSettings,
  getAttendanceSettings, updateAttendanceSettings,
  getMembershipSettings, updateMembershipSettings,
  getInvoiceSettings, updateInvoiceSettings,
  getSMTPSettings, updateSMTPSettings,
  getPaymentGatewaySettings, updatePaymentGatewaySettings,
} from '../../services/settingService.js';
import { uploadThemeAsset } from '../../services/themeService.js';
import { PLAN_TYPES } from '../../constants';

const TABS = [
  { id: 'general', label: 'General', icon: FiGlobe },
  { id: 'attendance', label: 'Attendance', icon: FiClock },
  { id: 'membership', label: 'Membership', icon: FiUsers },
  { id: 'invoice', label: 'Invoice', icon: FiFileText },
  { id: 'smtp', label: 'SMTP', icon: FiMail },
  { id: 'gateway', label: 'Payment Gateway', icon: FiCreditCard },
];

const assetUrl = (p) => {
  if (!p) return '';
  if (p.startsWith('http')) return p;
  if (p.startsWith('/uploads')) return `${API_BASE}${p}`;
  return p;
};

export default function SettingsPage() {
  const { theme, setThemeLocal } = useThemeStore();
  const [tab, setTab] = useState('general');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);

  const [general, setGeneral] = useState({});
  const [attendance, setAttendance] = useState({});
  const [membership, setMembership] = useState({});
  const [invoice, setInvoice] = useState({});
  const [smtp, setSmtp] = useState({});
  const [gateway, setGateway] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const [g, a, m, i, s, gw] = await Promise.all([
          getSettings(), getAttendanceSettings(), getMembershipSettings(),
          getInvoiceSettings(), getSMTPSettings(), getPaymentGatewaySettings(),
        ]);
        setGeneral(g); setAttendance(a); setMembership(m); setInvoice(i); setSmtp(s); setGateway(gw || {});
      } catch (e) { showMsg('Failed to load settings', 'error'); }
      setLoading(false);
    })();
  }, []);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const save = async (section, data, serviceFn) => {
    try {
      await serviceFn(data);
      showMsg(`${section} settings saved`);
    } catch (e) { showMsg(e.response?.data?.message || `Failed to save ${section} settings`, 'error'); }
  };

  const onUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await uploadThemeAsset(file, type);
      setThemeLocal({ [type]: url });
      setGeneral(prev => ({ ...prev, [type]: url }));
      showMsg(`${type} uploaded`);
    } catch (err) { showMsg('Upload failed', 'error'); }
    e.target.value = '';
  };

  const inputClass = 'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--primary)] outline-none transition-all';
  const labelClass = 'mb-1 block text-xs font-semibold text-[var(--text-secondary)]';
  const sectionTitle = 'text-lg font-bold text-[var(--text-primary)]';

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-[var(--primary)]/10 p-3"><FiGlobe size={24} className="text-[var(--primary)]" /></div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
          <p className="text-sm text-[var(--text-muted)]">System configuration</p>
        </div>
      </div>

      {msg.text && (
        <div className={`rounded-xl px-4 py-3 text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>
          {msg.type === 'success' && <FiCheck size={14} className="mr-1 inline" />}{msg.text}
        </div>
      )}

      <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setMsg({ text: '', type: '' }); }}
            className={`flex items-center gap-1.5 flex-shrink-0 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${tab === t.id ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">

        {/* ═══════ GENERAL ═══════ */}
        {tab === 'general' && (
          <div className="space-y-5">
            <h2 className={sectionTitle}>General Settings</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="Library Name" value={general.libraryName} onChange={v => setGeneral(p => ({ ...p, libraryName: v }))} />
              <InputField label="Email" type="email" value={general.email} onChange={v => setGeneral(p => ({ ...p, email: v }))} />
              <InputField label="Phone" type="tel" value={general.mobile} onChange={v => setGeneral(p => ({ ...p, mobile: v }))} />
              <InputField label="Website" type="url" value={general.website} onChange={v => setGeneral(p => ({ ...p, website: v }))} />
              <InputField label="GST Number" value={general.gstNumber} onChange={v => setGeneral(p => ({ ...p, gstNumber: v }))} />
              <InputField label="Support Email" type="email" value={general.supportEmail} onChange={v => setGeneral(p => ({ ...p, supportEmail: v }))} />
            </div>

            <div>
              <label className={labelClass}>Address</label>
              <textarea value={general.address || ''} onChange={e => setGeneral(p => ({ ...p, address: e.target.value }))} rows={3} className={`${inputClass} resize-none`} />
            </div>

            {/* Logo & Favicon inline */}
            <div className="grid gap-4 sm:grid-cols-2">
              {['logo', 'favicon'].map(type => (
                <div key={type} className="rounded-xl border border-[var(--border)] p-4">
                  <label className="mb-2 block text-xs font-semibold capitalize text-[var(--text-secondary)]">{type}</label>
                  <div className="flex items-center gap-4">
                    <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border bg-[var(--bg-secondary)]">
                      {(general[type] || theme[type]) ? <img src={assetUrl(general[type] || theme[type])} alt={type} className="h-full w-full object-contain p-1" /> : <FiImage size={18} className="text-[var(--text-muted)] opacity-40" />}
                    </div>
                    <input type="file" accept="image/*" onChange={e => onUpload(e, type)} className="text-xs" />
                  </div>
                </div>
              ))}
            </div>

            <SaveBtn onClick={() => save('General', general, updateSettings)} />
          </div>
        )}

        {/* ═══════ ATTENDANCE ═══════ */}
        {tab === 'attendance' && (
          <div className="space-y-5">
            <h2 className={sectionTitle}>Attendance Settings</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="Late Time (minutes)" type="number" value={attendance.lateTime} onChange={v => setAttendance(p => ({ ...p, lateTime: Number(v) }))} hint="Minutes after shift start considered late" />
              <InputField label="QR Code Expiry (minutes)" type="number" value={attendance.qrExpiry} onChange={v => setAttendance(p => ({ ...p, qrExpiry: Number(v) }))} hint="How long QR codes remain valid" />
              <InputField label="Attendance Radius (meters)" type="number" value={attendance.attendanceRadius} onChange={v => setAttendance(p => ({ ...p, attendanceRadius: Number(v) }))} hint="Geo-fence radius for attendance" />
              <InputField label="Auto Checkout Time" value={attendance.autoCheckoutTime} onChange={v => setAttendance(p => ({ ...p, autoCheckoutTime: v }))} hint="Time (HH:mm) for auto checkout" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!attendance.autoCheckout} onChange={e => setAttendance(p => ({ ...p, autoCheckout: e.target.checked }))} className="rounded" />
              <span className="text-sm font-medium text-[var(--text-primary)]">Enable Auto Checkout</span>
            </label>
            <SaveBtn onClick={() => save('Attendance', attendance, updateAttendanceSettings)} />
          </div>
        )}

        {/* ═══════ MEMBERSHIP ═══════ */}
        {tab === 'membership' && (
          <div className="space-y-5">
            <h2 className={sectionTitle}>Membership Settings</h2>

            <div>
              <label className={labelClass}>Membership Plans</label>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {PLAN_TYPES.map(p => (
                  <div key={p.value} className="rounded-xl border border-[var(--border)] bg-[var(--bg-input)] p-3 text-center">
                    <p className="text-sm font-bold text-[var(--text-primary)]">{p.label}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{p.days} days</p>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-[10px] text-[var(--text-muted)]">Plans are managed in the codebase. Contact developer to modify.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="Renewal Grace Period (days)" type="number" value={membership.renewalGracePeriod} onChange={v => setMembership(p => ({ ...p, renewalGracePeriod: Number(v) }))} hint="Days after expiry to allow renewal" />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!membership.autoExpiry} onChange={e => setMembership(p => ({ ...p, autoExpiry: e.target.checked }))} className="rounded" />
              <span className="text-sm font-medium text-[var(--text-primary)]">Auto Expire Memberships</span>
            </label>

            <SaveBtn onClick={() => save('Membership', membership, updateMembershipSettings)} />
          </div>
        )}

        {/* ═══════ INVOICE ═══════ */}
        {tab === 'invoice' && (
          <div className="space-y-5">
            <h2 className={sectionTitle}>Invoice Settings</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="Invoice Prefix" value={invoice.invoicePrefix} onChange={v => setInvoice(p => ({ ...p, invoicePrefix: v }))} hint="Prefix for invoice numbers (e.g. INV, LIB)" />
              <InputField label="GST Number" value={general.gstNumber || invoice.gstNumber} onChange={v => setInvoice(p => ({ ...p, gstNumber: v }))} />
            </div>
            <div>
              <label className={labelClass}>Invoice Footer</label>
              <textarea value={invoice.invoiceFooter || ''} onChange={e => setInvoice(p => ({ ...p, invoiceFooter: e.target.value }))} rows={2} className={`${inputClass} resize-none`} placeholder="Thank you for your business!" />
            </div>
            <div>
              <label className={labelClass}>Signature / Authorized By</label>
              <input value={invoice.invoiceSignature || ''} onChange={e => setInvoice(p => ({ ...p, invoiceSignature: e.target.value }))} className={inputClass} placeholder="Authorized signatory name" />
            </div>
            <SaveBtn onClick={() => save('Invoice', invoice, updateInvoiceSettings)} />
          </div>
        )}

        {/* ═══════ SMTP ═══════ */}
        {tab === 'smtp' && (
          <div className="space-y-5">
            <h2 className={sectionTitle}>SMTP Settings</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!smtp.enabled} onChange={e => setSmtp(p => ({ ...p, enabled: e.target.checked }))} className="rounded" />
              <span className="text-sm font-medium text-[var(--text-primary)]">Enable SMTP</span>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="SMTP Host" value={smtp.host} onChange={v => setSmtp(p => ({ ...p, host: v }))} placeholder="smtp.gmail.com" />
              <InputField label="SMTP Port" type="number" value={smtp.port} onChange={v => setSmtp(p => ({ ...p, port: Number(v) }))} placeholder="587" />
              <InputField label="Username" value={smtp.user} onChange={v => setSmtp(p => ({ ...p, user: v }))} />
              <InputField label="Password" type="password" value={smtp.pass} onChange={v => setSmtp(p => ({ ...p, pass: v }))} />
              <InputField label="From Email" type="email" value={smtp.from} onChange={v => setSmtp(p => ({ ...p, from: v }))} placeholder="noreply@library.com" />
            </div>
            <SaveBtn onClick={() => save('SMTP', smtp, updateSMTPSettings)} />
          </div>
        )}

        {/* ═══════ PAYMENT GATEWAY ═══════ */}
        {tab === 'gateway' && (
          <div className="space-y-6">
            <h2 className={sectionTitle}>Payment Gateway Settings</h2>
            
            {/* Razorpay */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-input)]/50 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Razorpay Integration</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!gateway.razorpayEnabled} onChange={e => setGateway(p => ({ ...p, razorpayEnabled: e.target.checked }))} className="rounded" />
                  <span className="text-xs font-semibold text-[var(--primary)]">Enable Razorpay</span>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Razorpay Key ID" value={gateway.razorpayKeyId} onChange={v => setGateway(p => ({ ...p, razorpayKeyId: v }))} placeholder="rzp_live_..." />
                <InputField label="Razorpay Key Secret" type="password" value={gateway.razorpayKeySecret} onChange={v => setGateway(p => ({ ...p, razorpayKeySecret: v }))} placeholder="Enter Razorpay Secret" />
              </div>
            </div>

            {/* Stripe */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-input)]/50 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Stripe Integration</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!gateway.stripeEnabled} onChange={e => setGateway(p => ({ ...p, stripeEnabled: e.target.checked }))} className="rounded" />
                  <span className="text-xs font-semibold text-[var(--primary)]">Enable Stripe</span>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Stripe Publishable Key" value={gateway.stripePublishableKey} onChange={v => setGateway(p => ({ ...p, stripePublishableKey: v }))} placeholder="pk_live_..." />
                <InputField label="Stripe Secret Key" type="password" value={gateway.stripeSecretKey} onChange={v => setGateway(p => ({ ...p, stripeSecretKey: v }))} placeholder="sk_live_..." />
                <InputField label="Stripe Webhook Secret" type="password" value={gateway.stripeWebhookSecret} onChange={v => setGateway(p => ({ ...p, stripeWebhookSecret: v }))} placeholder="whsec_..." />
              </div>
            </div>

            <SaveBtn onClick={() => save('Payment Gateway', gateway, updatePaymentGatewaySettings)} />
          </div>
        )}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text', placeholder, hint }) {
  const labelClass = 'mb-1 block text-xs font-semibold text-[var(--text-secondary)]';
  const inputClass = 'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--primary)] outline-none transition-all';
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {type === 'textarea' ? (
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} className={`${inputClass} resize-none`} rows={3} placeholder={placeholder} />
      ) : (
        <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} className={inputClass} placeholder={placeholder} />
      )}
      {hint && <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{hint}</p>}
    </div>
  );
}

function SaveBtn({ onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all">
      <FiSave size={14} /> Save Changes
    </button>
  );
}
