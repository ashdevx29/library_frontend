import React, { useState } from 'react';
import { getMembers } from '../../services/memberService.js';
import { FiUpload, FiDownload, FiFileText, FiUsers } from 'react-icons/fi';

export default function ImportExportPage() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const exportCSV = async () => {
    setLoading(true);
    try {
      const members = await getMembers({ limit: 1000 });
      const list = members.members || members || [];
      const headers = ['Name', 'Mobile', 'Email', 'Seat', 'Shift', 'Plan', 'Expiry', 'Status'];
      const rows = list.map(m => [m.fullName, m.mobile, m.email || '', m.seatId?.seatNumber || '', m.shiftId?.shiftName || '', m.membershipPlan || '', m.membershipExpiryDate ? new Date(m.membershipExpiryDate).toLocaleDateString() : '', m.status]);
      const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `members-export-${new Date().toISOString().split('T')[0]}.csv`; a.click();
      setMsg('Exported successfully!');
    } catch (e) { setMsg(e.message); }
    setLoading(false);
  };

  const exportJSON = async () => {
    setLoading(true);
    try {
      const members = await getMembers({ limit: 1000 });
      const list = members.members || members || [];
      const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `members-export-${new Date().toISOString().split('T')[0]}.json`; a.click();
      setMsg('JSON exported!');
    } catch (e) { setMsg(e.message); }
    setLoading(false);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setMsg('');
    try {
      const text = await file.text();
      const isCSV = file.name.endsWith('.csv');
      let rows;
      if (isCSV) {
        const lines = text.split('\n').filter(l => l.trim());
        rows = lines.slice(1).map(l => {
          const cols = l.split(',').map(c => c.replace(/^"|"$/g, '').trim());
          return { fullName: cols[0], mobile: cols[1], email: cols[2] || '', membershipPlan: cols[5] || 'Monthly' };
        });
      } else {
        rows = JSON.parse(text);
      }
      setMsg(`Parsed ${rows.length} members. Import functionality requires backend import endpoint.`);
    } catch (e) { setMsg(`Import error: ${e.message}`); }
    setLoading(false); e.target.value = '';
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-[var(--primary)]/10 p-3"><FiUpload size={24} className="text-[var(--primary)]" /></div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Import & Export</h1>
          <p className="text-sm text-[var(--text-muted)]">Bulk member data management</p>
        </div>
      </div>

      {msg && <div className={`rounded-xl px-4 py-3 text-sm ${msg.includes('error') ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>{msg}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Import */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className="mb-4 flex items-center gap-2">
            <FiUpload size={20} className="text-[var(--primary)]" />
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Import Members</h2>
          </div>
          <p className="mb-4 text-xs text-[var(--text-muted)]">Upload a CSV or JSON file with member data. Columns: Name, Mobile, Email, Seat, Shift, Plan, Expiry.</p>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-secondary)] p-8 hover:border-[var(--primary)] transition-all">
            <FiUpload size={20} className="text-[var(--text-muted)]" />
            <span className="text-xs font-semibold text-[var(--text-secondary)]">{loading ? 'Processing...' : 'Choose CSV or JSON file'}</span>
            <input type="file" accept=".csv,.json" onChange={handleImport} className="hidden" disabled={loading} />
          </label>
        </div>

        {/* Export */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className="mb-4 flex items-center gap-2">
            <FiDownload size={20} className="text-[var(--primary)]" />
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Export Members</h2>
          </div>
          <p className="mb-4 text-xs text-[var(--text-muted)]">Download all member data in your preferred format.</p>
          <div className="space-y-2">
            <button onClick={exportCSV} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 text-sm font-semibold text-[var(--text-primary)] hover:border-green-500 hover:text-green-600 transition-all disabled:opacity-50">
              <FiFileText size={16} /> Export as CSV
            </button>
            <button onClick={exportJSON} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 text-sm font-semibold text-[var(--text-primary)] hover:border-blue-500 hover:text-blue-600 transition-all disabled:opacity-50">
              <FiFileText size={16} /> Export as JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
