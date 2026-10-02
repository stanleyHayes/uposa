import { Router } from 'express';
import * as ctrl from './site-data.controller';
import { adminMiddleware, requirePermission, requireAnyPermission } from '../../middleware/admin.middleware';
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
// Config is gated per key (site-data.service.ts → configKeyPermission): About-page keys
// (mission, history, stats, schoolInfo, constitution) need about:*, the rest site:*.
adminSiteDataRouter.get('/config', requireAnyPermission('site:view', 'about:view'), ctrl.getAllConfigs);
// Site config includes the platform fee and the bank/MoMo details shown to
// donors, so site:edit is not in the MODERATOR defaults.
adminSiteDataRouter.put('/config/:key', requireAnyPermission('site:edit', 'about:edit'), ctrl.upsertConfig);
// About page & documents (constitution, forms) and year-group representatives.
adminSiteDataRouter.post('/upload-document', requirePermission('about:edit'), uploadLimiter, uploadDocument('document'), ctrl.uploadDocumentHandler);
adminSiteDataRouter.post('/year-group-reps', requirePermission('about:edit'), ctrl.createRep);
adminSiteDataRouter.put('/year-group-reps/:id', requirePermission('about:edit'), ctrl.updateRep);
adminSiteDataRouter.delete('/year-group-reps/:id', requirePermission('about:edit'), ctrl.deleteRep);
