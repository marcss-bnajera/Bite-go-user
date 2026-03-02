
import { Router } from 'express';
import {
    getOrdersByUser,
    createOrder,
    updateOrder,
    deleteOrder
} from './orders-controller.js';

const router = Router();

router.get('/user/:id_user', getOrdersByUser);
router.post('/', createOrder);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);

export default router;
