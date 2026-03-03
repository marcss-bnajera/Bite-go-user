import { Router } from 'express';
import {
    getMenuForUser,
    searchProductsUser,
    getProductById
} from './products-controller.js';

const router = Router();

// Endpoint estrella para el cliente: Ver el menú de un local
router.get('/menu/:id_restaurante', getMenuForUser);

// Buscar comida por nombre (Ej: "Pizza")
router.get('/search', searchProductsUser);

// Ver detalle de un plato específico
router.get('/:id', getProductById);

export default router;