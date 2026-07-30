import React from 'react';
import { FiUpload, FiDownload, FiUsers } from 'react-icons/fi';
import ExportButton from '../../components/ui/ExportButton';
import ImportButton from '../../components/ui/ImportButton';

export default function ImportExportPage() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-[var(--primary)]/10 p-3"><FiUpload size={24} className="text-[var(--primary)]" /></div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Import & Export</h1>
          <p className="text-sm text-[var(--text-muted)]">Bulk member data management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className="mb-4 flex items-center gap-2">
            <FiUpload size={20} className="text-[var(--primary)]" />
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Import Members</h2>
          </div>
          <p className="mb-4 text-xs text-[var(--text-muted)]">Upload a CSV or Excel file with member data. Required: Name, Mobile. Optional: Email, Address, Aadhaar, Plan, Joining, Expiry, Status.</p>
          <ImportButton entity="members" label="Choose File & Import" />
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className="mb-4 flex items-center gap-2">
            <FiDownload size={20} className="text-[var(--primary)]" />
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Export Members</h2>
          </div>
          <p className="mb-4 text-xs text-[var(--text-muted)]">Download all member data in your preferred format.</p>
          <ExportButton entity="members" filename="members-export" params={{ limit: 10000 }} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className="mb-3 flex items-center gap-2">
            <FiUpload size={18} className="text-[var(--primary)]" />
            <h3 className="font-bold text-[var(--text-primary)]">Expenses</h3>
          </div>
          <div className="flex gap-2">
            <ImportButton entity="expenses" label="Import" />
            <ExportButton entity="expenses" filename="expenses-export" params={{ limit: 10000 }}>Export</ExportButton>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className="mb-3 flex items-center gap-2">
            <FiUpload size={18} className="text-[var(--primary)]" />
            <h3 className="font-bold text-[var(--text-primary)]">Payments</h3>
          </div>
          <div className="flex gap-2">
            <ImportButton entity="payments" label="Import" />
            <ExportButton entity="payments" filename="payments-export" params={{ limit: 10000 }}>Export</ExportButton>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className="mb-3 flex items-center gap-2">
            <FiDownload size={18} className="text-[var(--primary)]" />
            <h3 className="font-bold text-[var(--text-primary)]">Attendance</h3>
          </div>
          <ExportButton entity="attendance" filename="attendance-export" params={{ limit: 10000 }}>Export Attendance</ExportButton>
        </div>
      </div>
    </div>
  );
}
