import { Router } from 'express';
import {
    getProducts,
    getProductById,
    getProductsByRestaurant
} from './products-controller.js';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.get('/restaurant/:id_restaurante', getProductsByRestaurant);

export default router;