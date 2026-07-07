import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { param } from 'express-validator';
import { checkValidators } from '../../middlewares/check-validators.js';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from './notifications-controller.js';

const router = Router();

router.get('/', validateJWT, getNotifications);
router.get('/unread-count', validateJWT, getUnreadCount);
router.put('/read-all', validateJWT, markAllAsRead);
router.put('/:id/read', validateJWT, [
    param('id').isMongoId().withMessage('ID de notificación no válido'),
    checkValidators
], markAsRead);

export default router;
