import { z } from 'zod';
import { isKnownPermission } from '../../config/permissions';

// Unknown permission strings are rejected (422 via the ZodError handler).
const permissionList = z.array(z.string()).superRefine((perms, ctx) => {
  const unknown = perms.filter((p) => !isKnownPermission(p));
  if (unknown.length) ctx.addIssue({ code: 'custom', message: `Unknown permission(s): ${unknown.join(', ')}` });
});

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Role name is required').max(60),
    description: z.string().trim().max(300).optional(),
    permissions: permissionList,
  }),
});

export const updateRoleSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(60).optional(),
    description: z.string().trim().max(300).optional(),
    permissions: permissionList.optional(),
  }),
});

export const updateAdminPermissionsSchema = z.object({
  body: z.object({
    role: z.string().trim().min(1).optional(),
    grant: permissionList.optional(),
    revoke: permissionList.optional(),
  }),
});
