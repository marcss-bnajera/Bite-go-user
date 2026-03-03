
import { Router } from 'express';
import { validateJWT } from "../../middlewares/validate-jwt.js";

import {
    getOrdersByUser,
    createOrder,
    deleteOrder
} from './orders-controller.js';

const router = Router();

router.get('/history/:id_user', validateJWT, getOrdersByUser);
router.post('/', validateJWT, createOrder);
router.delete('/:id', validateJWT, deleteOrder);

export default router;
