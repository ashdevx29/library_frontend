export function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function getThemeColors() {
  return {
    primary: getCssVar('--primary') || '#FF6B00',
    secondary: getCssVar('--secondary') || '#FFA000',
    accent: getCssVar('--accent') || '#FFB800',
    sidebar: getCssVar('--sidebar') || '#0f172a',
    header: getCssVar('--header') || '#ffffff',
    button: getCssVar('--button') || '#FF6B00',
    bg: getCssVar('--bg') || '#FFF8F1',
    textPrimary: getCssVar('--text-primary') || '#0f172a',
    textSecondary: getCssVar('--text-secondary') || '#64748b',
  };
}

export const CHART_COLORS = {
  present: '#22c55e',
  absent: '#cbd5e1',
  late: '#FFB800',
  income: getCssVar('--primary') || '#FF6B00',
  expense: '#ef4444',
  occupied: getCssVar('--primary') || '#FF6B00',
  available: '#22c55e',
  reserved: getCssVar('--accent') || '#FFB800',
  maintenance: '#94a3b8',
  growth: getCssVar('--secondary') || '#FFA000',
};

export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
