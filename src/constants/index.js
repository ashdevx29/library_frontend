export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  BRANCH_ADMIN: 'Branch Admin',
  STAFF: 'Staff',
  STUDENT: 'Student',
};

export const PLAN_TYPES = [
  { value: 'Monthly', label: '1 Month', days: 30 },
  { value: 'Quarterly', label: '3 Months', days: 90 },
  { value: 'Half-Yearly', label: '6 Months', days: 180 },
  { value: 'Yearly', label: '12 Months', days: 365 },
];

export const SEAT_STATUSES = ['Available', 'Occupied', 'Reserved', 'Inactive'];
export const SEAT_TYPES = ['Standard', 'Premium', 'AC', 'VIP'];
export const MEMBER_STATUSES = ['Active', 'Inactive', 'Suspended'];
export const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Online'];
export const PAYMENT_STATUSES = ['Paid', 'Pending', 'Failed'];
export const EXPENSE_CATEGORIES = ['Rent', 'Utilities', 'Maintenance', 'Salary', 'Furniture', 'Supplies', 'Internet', 'Cleaning', 'Marketing', 'General'];
export const NOTIFICATION_TYPES = ['Fee Reminder', 'Membership Expiry', 'Attendance Alert', 'General Notice'];

export const COLORS = {
  primary: 'var(--primary)',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
};

export const STATUS_COLORS = {
  Active: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  Inactive: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  Suspended: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  Available: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  Occupied: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  Reserved: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  Paid: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  Failed: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  Sent: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  Draft: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
};
