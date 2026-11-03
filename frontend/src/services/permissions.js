export const rolePermissions = {
  Admin: ["fine:read", "fine:review", "users:read", "users:approve"],
  "Super User": ["fine:read", "fine:review"],
  Viewer: ["fine:read"],
};

export const can = (role, permission) =>
  Boolean(rolePermissions[role]?.includes(permission));
