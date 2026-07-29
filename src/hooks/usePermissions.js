import useAuthStore from '../store/authStore';

export default function usePermissions() {
  const { user } = useAuthStore();
  const permissions = user?.permissions || [];

  const has = (permission) => {
    if (permissions.includes('*')) return true;
    return permissions.includes(permission);
  };

  const hasAny = (...perms) => perms.some(p => has(p));
  const hasAll = (...perms) => perms.every(p => has(p));

  const canView = (module) => has(`${module}:View`);
  const canCreate = (module) => has(`${module}:Create`);
  const canEdit = (module) => has(`${module}:Edit`);
  const canDelete = (module) => has(`${module}:Delete`);

  return { permissions, has, hasAny, hasAll, canView, canCreate, canEdit, canDelete, isAdmin: user?.role === 'Super Admin' };
}
