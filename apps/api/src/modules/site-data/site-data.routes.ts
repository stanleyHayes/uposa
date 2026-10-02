import { Router } from 'express';
import * as ctrl from './site-data.controller';
import { adminMiddleware, requireAdminRole } from '../../middleware/admin.middleware';
import { uploadDocument } from '../../middleware/upload.middleware';
import { uploadLimiter } from '../../middleware/ratelimit.middleware';

const router = Router();

// Public endpoints
router.get('/site-data', ctrl.getPublicSiteData);
router.get('/config/:key', ctrl.getConfigByKey);
router.get('/year-group-reps', ctrl.getYearGroupReps);

export default router;

// Admin routes
export const adminSiteDataRouter = Router();
adminSiteDataRouter.use(adminMiddleware);
adminSiteDataRouter.get('/config', ctrl.getAllConfigs);
// Site config includes the platform fee and the bank/MoMo details shown to
// donors — changing it is a financial operation: ADMIN / SUPER_ADMIN only.
adminSiteDataRouter.put('/config/:key', requireAdminRole, ctrl.upsertConfig);
adminSiteDataRouter.post('/upload-document', uploadLimiter, uploadDocument('document'), ctrl.uploadDocumentHandler);
adminSiteDataRouter.post('/year-group-reps', ctrl.createRep);
adminSiteDataRouter.put('/year-group-reps/:id', ctrl.updateRep);
adminSiteDataRouter.delete('/year-group-reps/:id', ctrl.deleteRep);
