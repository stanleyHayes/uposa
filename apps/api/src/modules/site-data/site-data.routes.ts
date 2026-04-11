import { Router } from 'express';
import * as ctrl from './site-data.controller';
import { adminMiddleware } from '../../middleware/admin.middleware';
import { uploadDocument } from '../../middleware/upload.middleware';

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
adminSiteDataRouter.put('/config/:key', ctrl.upsertConfig);
adminSiteDataRouter.post('/upload-document', uploadDocument('document'), ctrl.uploadDocumentHandler);
adminSiteDataRouter.post('/year-group-reps', ctrl.createRep);
adminSiteDataRouter.put('/year-group-reps/:id', ctrl.updateRep);
adminSiteDataRouter.delete('/year-group-reps/:id', ctrl.deleteRep);
