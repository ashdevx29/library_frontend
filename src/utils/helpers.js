export const cn = (...classes) => classes.filter(Boolean).join(' ');

export const formatDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export const formatPhone = (p) => {
  if (!p) return '-';
  const s = String(p);
  return s.length === 10 ? `${s.slice(0, 5)}-${s.slice(5)}` : s;
};

export const timeAgo = (date) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
};

export const daysLeft = (date) => {
  if (!date) return 0;
  return Math.max(Math.ceil((new Date(date) - new Date()) / 86400000), 0);
};

export const calculateRemainingDays = (expiryDate) => {
  if (!expiryDate) return 0;
  const exp = new Date(expiryDate);
  exp.setHours(23, 59, 59, 999);
  const now = new Date();
  const diffMs = exp.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

export const truncate = (str, len = 50) => {
  if (!str || str.length <= len) return str || '';
  return str.slice(0, len) + '...';
};
