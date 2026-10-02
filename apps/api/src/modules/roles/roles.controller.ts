import { Response } from 'express';
import { RouteRequest } from '../../types/request.types';
import { createRoleSchema, updateRoleSchema, updateAdminPermissionsSchema } from './roles.validation';
import {
  Actor,
  getPermissionCatalog,
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  getAdminPermissions,
  updateAdminPermissions,
} from './roles.service';
import { successResponse } from '../../utils/response.utils';

function actorOf(req: RouteRequest): Actor {
  return { id: String(req.admin?.id), role: String(req.admin?.role), permissions: req.admin?.permissions ?? [] };
}

export async function getCatalogHandler(_req: RouteRequest, res: Response): Promise<void> {
  successResponse(res, 'Permission catalog retrieved', getPermissionCatalog());
}

export async function listRolesHandler(_req: RouteRequest, res: Response): Promise<void> {
  successResponse(res, 'Roles retrieved', await listRoles());
}

export async function createRoleHandler(req: RouteRequest, res: Response): Promise<void> {
  const parsed = createRoleSchema.parse({ body: req.body });
  successResponse(res, 'Role created', await createRole(actorOf(req), parsed.body), 201);
}

export async function updateRoleHandler(req: RouteRequest, res: Response): Promise<void> {
  const parsed = updateRoleSchema.parse({ body: req.body });
  successResponse(res, 'Role updated', await updateRole(actorOf(req), req.params.key, parsed.body));
}

export async function deleteRoleHandler(req: RouteRequest, res: Response): Promise<void> {
  const result = await deleteRole(req.params.key);
  successResponse(res, result.message);
}

export async function getAdminPermissionsHandler(req: RouteRequest, res: Response): Promise<void> {
  successResponse(res, 'Admin permissions retrieved', await getAdminPermissions(req.params.id));
}

export async function updateAdminPermissionsHandler(req: RouteRequest, res: Response): Promise<void> {
  const parsed = updateAdminPermissionsSchema.parse({ body: req.body });
  successResponse(res, 'Admin permissions updated', await updateAdminPermissions(actorOf(req), req.params.id, parsed.body));
}
