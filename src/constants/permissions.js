export const MODULES = ['Members', 'Attendance', 'Payments', 'Expenses', 'Reports', 'Settings', 'Notifications', 'Shifts', 'Seats', 'Backup', 'Logs', 'Announcements', 'Roles'];

export const PERMISSION_MAP = {
  Members:     ['View', 'Create', 'Edit', 'Delete'],
  Attendance:  ['View', 'Create', 'Edit'],
  Payments:    ['View', 'Create', 'Delete'],
  Expenses:    ['View', 'Create', 'Edit'],
  Reports:     ['View'],
  Settings:    ['View', 'Edit'],
  Notifications: ['Create', 'Delete'],
  Shifts:      ['View', 'Create', 'Edit', 'Delete'],
  Seats:       ['View', 'Create', 'Edit', 'Delete'],
  Backup:      ['View', 'Create', 'Delete'],
  Logs:        ['View'],
  Announcements: ['View', 'Create', 'Edit', 'Delete'],
  Roles:       ['View', 'Create', 'Edit', 'Delete'],
};

export const ALL_PERMISSIONS = Object.entries(PERMISSION_MAP).flatMap(([mod, actions]) =>
  actions.map(action => `${mod}:${action}`)
);
