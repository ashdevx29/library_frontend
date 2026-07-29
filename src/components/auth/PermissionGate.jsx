import usePermissions from '../../hooks/usePermissions';

export default function PermissionGate({ permission, module, action = 'View', fallback = null, children }) {
  const { has } = usePermissions();
  const perm = permission || `${module}:${action}`;
  if (!has(perm)) return fallback;
  return children;
}

export function CanCreate({ module, children, fallback = null }) {
  const { canCreate } = usePermissions();
  if (!canCreate(module)) return fallback;
  return children;
}

export function CanEdit({ module, children, fallback = null }) {
  const { canEdit } = usePermissions();
  if (!canEdit(module)) return fallback;
  return children;
}

export function CanDelete({ module, children, fallback = null }) {
  const { canDelete } = usePermissions();
  if (!canDelete(module)) return fallback;
  return children;
}

export function CanView({ module, children, fallback = null }) {
  const { canView } = usePermissions();
  if (!canView(module)) return fallback;
  return children;
}
