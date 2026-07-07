import { Router } from 'express';
import {
    getProducts,
    getProductsByRestaurant,
    getMenuForUser,
    searchProductsUser,
    getProductById
} from './products-controller.js';

const router = Router();

// Endpoint estrella para el cliente: Ver el menú de un local
router.get('/menu/:id_restaurante', getMenuForUser);

// Buscar comida por nombre
router.get('/search', searchProductsUser);

// Listar todos los productos (catálogo general)
router.get('/', getProducts);

// Productos por restaurante
router.get('/restaurant/:id_restaurante', getProductsByRestaurant);

// Detalle de un producto
router.get('/:id', getProductById);

export default router;