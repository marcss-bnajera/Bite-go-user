
import { Router } from 'express';
import { validateJWT } from "../../middlewares/validate-jwt.js";
import { param } from "express-validator";
import { checkValidators } from "../../middlewares/check-validators.js";

import {
    getOrdersByUser,
    createOrder,
    deleteOrder
} from './orders-controller.js';
import {
    validateCreateOrder,
} from "../../middlewares/order-validator.js";

const router = Router();

router.get('/history', validateJWT, getOrdersByUser);
router.post('/', validateJWT, validateCreateOrder, createOrder);
router.delete('/:id', validateJWT, [
    param('id').isMongoId().withMessage('ID de pedido no válido'),
    checkValidators
], deleteOrder);

export default router;
