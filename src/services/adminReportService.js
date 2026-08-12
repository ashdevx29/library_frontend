const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const h = (extra = {}) => {
  const t = localStorage.getItem('accessToken');
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}), ...extra };
};

const q = params => { const u = new URLSearchParams(); Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') u.append(k, String(v)); }); return u.toString(); };

const api = async (path, opts = {}) => {
  const res = await fetch(`${API}/admin-reports${path}`, { headers: h(), ...opts });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Request failed');
  return data.data;
};

export const adminReportService = {
  attendanceDaily: async (date, shiftId) => api(`/attendance/daily?${q({ date, shiftId })}`),
  attendanceMonthly: async (month, year, shiftId) => api(`/attendance/monthly?${q({ month, year, shiftId })}`),
  attendanceYearly: async (year, month, shiftId) => api(`/attendance/yearly?${q({ year, month, shiftId })}`),
  attendanceMemberDetails: async (memberId, month, year) => api(`/attendance/member-details?${q({ memberId, month, year })}`),
  feesDaily: async date => api(`/fees/daily?${q({ date })}`),
  feesMonthly: async (month, year) => api(`/fees/monthly?${q({ month, year })}`),
  feesYearly: async year => api(`/fees/yearly?${q({ year })}`),
  feesPending: async () => api('/fees/pending'),
  membershipOverview: async () => api('/membership'),
  seatOverview: async () => api('/seats'),
};
