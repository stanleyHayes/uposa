import { Router } from 'express';
import { adminMiddleware, requirePermission } from '../../middleware/admin.middleware';
import {
  getCatalogHandler,
  listRolesHandler,
  createRoleHandler,
  updateRoleHandler,
  deleteRoleHandler,
  getAdminPermissionsHandler,
  updateAdminPermissionsHandler,
} from './roles.controller';

// Mounted at /api/admin (shared prefix, so auth is per route rather than router.use)
const router = Router();

router.get('/permissions', adminMiddleware, requirePermission('roles:view'), getCatalogHandler);

router.get('/roles', adminMiddleware, requirePermission('roles:view'), listRolesHandler);
router.post('/roles', adminMiddleware, requirePermission('roles:edit'), createRoleHandler);
router.put('/roles/:key', adminMiddleware, requirePermission('roles:edit'), updateRoleHandler);
router.delete('/roles/:key', adminMiddleware, requirePermission('roles:edit'), deleteRoleHandler);

// Per-admin role + overrides, on the existing admin-users base path (/api/admin/admins)
router.get('/admins/:id/permissions', adminMiddleware, requirePermission('roles:view'), getAdminPermissionsHandler);
router.put('/admins/:id/permissions', adminMiddleware, requirePermission('roles:edit'), updateAdminPermissionsHandler);

export default router;
