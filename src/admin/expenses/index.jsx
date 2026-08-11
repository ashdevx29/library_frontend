import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getExpenses, getExpenseStats, getExpenseCategories, createExpense, updateExpense, deleteExpense, getDailyReport, getMonthlyReport, getYearlyReport } from '../../services/expenseService';
import { FiPlus, FiEdit2, FiTrash2, FiCalendar, FiDollarSign, FiFilter, FiX } from 'react-icons/fi';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const TABS = ['Expenses', 'Add Expense', 'Reports'];

const AdminExpensesPage = () => {
  const [tab, setTab] = useState('Expenses');
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMethod, setFilterMethod] = useState('');

  // Reports
  const [reportTab, setReportTab] = useState('Daily');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportMonth, setReportMonth] = useState(String(new Date().getMonth() + 1));
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Form
  const [form, setForm] = useState({ title: '', amount: '', category: 'General', expenseDate: new Date().toISOString().split('T')[0], description: '', paymentMethod: 'Cash' });
  const [formLoading, setFormLoading] = useState(false);
  const [formResult, setFormResult] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => { loadAll(); }, []);

  useEffect(() => { loadExpenses(); }, [filterCategory, filterMethod]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [e, s, c] = await Promise.all([getExpenses(), getExpenseStats(), getExpenseCategories()]);
      setExpenses(e); setStats(s); setCategories(c);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadExpenses = async () => {
    try {
      const params = {};
      if (filterCategory) params.category = filterCategory;
      if (filterMethod) params.paymentMethod = filterMethod;
      setExpenses(await getExpenses(params));
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true); setFormResult(null);
    try {
      if (editItem) {
        await updateExpense(editItem._id, { ...form, amount: Number(form.amount) });
        setFormResult({ success: true, message: 'Updated successfully' });
      } else {
        await createExpense({ ...form, amount: Number(form.amount) });
        setFormResult({ success: true, message: 'Created successfully' });
      }
      setForm({ title: '', amount: '', category: 'General', expenseDate: new Date().toISOString().split('T')[0], description: '', paymentMethod: 'Cash' });
      setEditItem(null);
      loadAll();
    } catch (err) { setFormResult({ success: false, message: err.response?.data?.message || 'Failed' }); }
    finally { setFormLoading(false); }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({
      title: item.title, amount: item.amount, category: item.category,
      expenseDate: new Date(item.expenseDate).toISOString().split('T')[0],
      description: item.description || '', paymentMethod: item.paymentMethod || 'Cash',
    });
    setShowForm(true);
    setTab('Add Expense');
  };

  const handleDelete = (id) => setConfirmId(id);

  const doDelete = async () => {
    try { await deleteExpense(confirmId); loadAll(); toast.success('Expense deleted'); } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    setConfirmId(null);
  };

  const fetchReport = async () => {
    setReportLoading(true);
    try {
      let data;
      if (reportTab === 'Daily') data = await getDailyReport(reportDate);
      else if (reportTab === 'Monthly') data = await getMonthlyReport(reportMonth, reportYear);
      else data = await getYearlyReport(reportYear);
      setReportData(data);
    } catch (e) { console.error(e); }
    finally { setReportLoading(false); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const field = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white';
  const label = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300';

  if (loading) return <div className="py-16 text-center text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Expense Management</h1><p className="text-sm text-slate-500 dark:text-slate-400">Track and manage library expenses</p></div>
      </div>

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {TABS.map(t => (
          <button key={t} onClick={() => { setTab(t); if (t === 'Add Expense') { setEditItem(null); setForm({ title: '', amount: '', category: 'General', expenseDate: new Date().toISOString().split('T')[0], description: '', paymentMethod: 'Cash' }); } }} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${tab === t ? 'bg-white text-orange-600 shadow dark:bg-slate-700 dark:text-orange-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>{t}</button>
        ))}
      </div>

      {/* Stats Bar */}
      {tab !== 'Reports' && stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            ['Today', money(stats.todayTotal), 'orange'],
            ['This Month', money(stats.monthTotal), 'blue'],
            ['This Year', money(stats.yearTotal), 'purple'],
            ['All Time', money(stats.totalAll), 'green'],
          ].map(([l, v, c]) => (
            <div key={l} className={`rounded-xl bg-${c}-50 p-3 text-center dark:bg-${c}-900/20`}>
              <p className="text-xs text-slate-500">{l}</p>
              <p className={`text-lg font-bold text-${c}-600`}>{v}</p>
            </div>
          ))}
        </div>
      )}

      {/* Expenses List */}
      {tab === 'Expenses' && (
        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <FiFilter className="text-slate-400" />
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={field + ' w-auto'}><option value="">All Categories</option>{categories.map(c => <option key={c}>{c}</option>)}</select>
            <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} className={field + ' w-auto'}><option value="">All Methods</option>{['Cash', 'UPI', 'Bank Transfer'].map(m => <option key={m}>{m}</option>)}</select>
            <span className="text-sm text-slate-400">{expenses.length} expenses</span>
          </div>
          {!expenses.length ? <p className="py-8 text-center text-slate-400">No expenses</p> : (
            <div className="space-y-2">
              {expenses.map(ex => (
                <div key={ex._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center dark:bg-orange-900/30"><FiDollarSign className="text-orange-500" /></div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">{ex.title}</p>
                      <p className="text-xs text-slate-400">{ex.category} · {fmt(ex.expenseDate)} · {ex.paymentMethod}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-slate-800 dark:text-white">{money(ex.amount)}</p>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(ex)} className="rounded-lg bg-blue-50 p-1.5 text-blue-500 hover:bg-blue-100"><FiEdit2 size={14} /></button>
                      <button onClick={() => handleDelete(ex._id)} className="rounded-lg bg-red-50 p-1.5 text-red-500 hover:bg-red-100"><FiTrash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Expense */}
      {tab === 'Add Expense' && (
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800">
          <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">{editItem ? 'Edit Expense' : 'Add Expense'}</h2>
          {formResult && <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${formResult.success ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'}`}>{formResult.message}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className={label}>Title *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className={field} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={label}>Amount (₹) *</label><input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required className={field} /></div>
              <div><label className={label}>Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={field}>{categories.map(c => <option key={c}>{c}</option>)}</select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={label}>Date *</label><input type="date" value={form.expenseDate} onChange={e => setForm({ ...form, expenseDate: e.target.value })} required className={field} /></div>
              <div><label className={label}>Payment Method</label>
                <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} className={field}>{['Cash', 'UPI', 'Bank Transfer'].map(m => <option key={m}>{m}</option>)}</select>
              </div>
            </div>
            <div><label className={label}>Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className={field} /></div>
            <div className="flex gap-3">
              <button type="submit" disabled={formLoading} className="rounded-xl bg-[var(--button)] px-6 py-2.5 font-semibold text-white disabled:opacity-60">{formLoading ? 'Saving...' : editItem ? 'Update' : 'Add Expense'}</button>
              {editItem && <button type="button" onClick={() => { setEditItem(null); setForm({ title: '', amount: '', category: 'General', expenseDate: new Date().toISOString().split('T')[0], description: '', paymentMethod: 'Cash' }); }} className="rounded-xl border border-slate-200 px-6 py-2.5 dark:border-slate-700 dark:text-white">Cancel</button>}
            </div>
          </form>
        </div>
      )}

      {/* Reports */}
      {tab === 'Reports' && (
        <div className="space-y-4">
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 w-fit">
            {['Daily', 'Monthly', 'Yearly'].map(t => (
              <button key={t} onClick={() => { setReportTab(t); setReportData(null); }} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${reportTab === t ? 'bg-white text-orange-600 shadow dark:bg-slate-700 dark:text-orange-400' : 'text-slate-500'}`}>{t}</button>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
            {reportTab === 'Daily' && <div><label className={label}>Date</label><input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className={field} /></div>}
            {reportTab === 'Monthly' && <>
              <div><label className={label}>Month</label><select value={reportMonth} onChange={e => setReportMonth(e.target.value)} className={field}>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>)}</select></div>
              <div><label className={label}>Year</label><input type="number" value={reportYear} onChange={e => setReportYear(e.target.value)} min="2020" max="2099" className={field} /></div>
            </>}
            {reportTab === 'Yearly' && <div><label className={label}>Year</label><input type="number" value={reportYear} onChange={e => setReportYear(e.target.value)} min="2020" max="2099" className={field} /></div>}
            <button onClick={fetchReport} disabled={reportLoading} className="rounded-xl bg-[var(--button)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{reportLoading ? 'Loading...' : 'View Report'}</button>
          </div>

          {reportData && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-red-50 p-5 text-center dark:bg-red-900/20"><p className="text-xs text-slate-500">Total Expenses</p><p className="text-2xl font-bold text-red-600">{money(reportData.total)}</p></div>
                <div className="rounded-2xl bg-blue-50 p-5 text-center dark:bg-blue-900/20"><p className="text-xs text-slate-500">Total Entries</p><p className="text-2xl font-bold text-blue-600">{reportData.count}</p></div>
                {reportTab === 'Daily' && <div className="rounded-2xl bg-green-50 p-5 text-center dark:bg-green-900/20"><p className="text-xs text-slate-500">Average</p><p className="text-2xl font-bold text-green-600">{reportData.count > 0 ? money(Math.round(reportData.total / reportData.count)) : '₹0'}</p></div>}
              </div>

              {reportTab === 'Monthly' && reportData.byCategory && Object.keys(reportData.byCategory).length > 0 && (
                <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
                  <h3 className="mb-3 font-semibold text-slate-800 dark:text-white">By Category</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Object.entries(reportData.byCategory).sort(([, a], [, b]) => b - a).map(([cat, amt]) => (
                      <div key={cat} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-700/50">
                        <span className="text-sm text-slate-600 dark:text-slate-400">{cat}</span>
                        <span className="font-bold text-slate-800 dark:text-white">{money(amt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reportTab === 'Yearly' && (
                <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
                  <h3 className="mb-3 font-semibold text-slate-800 dark:text-white">Monthly Breakdown</h3>
                  <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {reportData.byMonth.map(m => (
                      <div key={m.month} className={`rounded-xl p-3 text-center ${m.total > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
                        <p className="text-xs text-slate-500">{new Date(2024, m.month - 1).toLocaleString('en', { month: 'short' })}</p>
                        <p className={`text-lg font-bold ${m.total > 0 ? 'text-red-600' : 'text-slate-400'}`}>{money(m.total)}</p>
                        <p className="text-xs text-slate-400">{m.count} entries</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
                <h3 className="mb-3 font-semibold text-slate-800 dark:text-white">Expense Records</h3>
                {!reportData.expenses.length ? <p className="py-6 text-center text-slate-400">No expenses</p> : (
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {reportData.expenses.slice(0, 50).map(ex => (
                      <div key={ex._id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-700/50">
                        <div><p className="text-sm font-medium text-slate-800 dark:text-white">{ex.title}</p><p className="text-xs text-slate-400">{ex.category} · {fmt(ex.expenseDate)}</p></div>
                        <p className="font-bold text-red-600">{money(ex.amount)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {!reportData && (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm dark:bg-slate-800"><FiCalendar className="mx-auto mb-3 text-5xl text-slate-300" /><p className="text-slate-400">Select a period and click "View Report"</p></div>
          )}
        </div>
      )}
      <ConfirmDialog
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={doDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record?"
        confirmText="Delete Expense"
        variant="danger"
      />
    </div>
  );
};

export default AdminExpensesPage;
