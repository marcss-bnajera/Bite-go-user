import { Router } from 'express';
import {
    getMenuForUser,
    searchProductsUser
} from './products-controller.js';

const router = Router();

// Endpoint estrella para el cliente: Ver el menú de un local
router.get('/menu/:id_restaurante', getMenuForUser);

// Buscar comida por nombre (Ej: "Pizza")
router.get('/search', searchProductsUser);

export default router;