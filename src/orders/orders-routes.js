
import { Router } from 'express';
import { validateJWT } from "../../middlewares/validate-jwt.js";

import {
    getOrdersByUser,
    createOrder,
    deleteOrder
} from './orders-controller.js';
import {
    validateCreateOrder,
    validateUpdateOrder,
    validateOrderParams
} from "../../middlewares/order-validator.js";

const router = Router();

router.get('/history/:id_user', validateJWT, getOrdersByUser);
router.post('/', validateJWT, validateCreateOrder, createOrder);
router.delete('/:id', validateJWT, deleteOrder);

export default router;
