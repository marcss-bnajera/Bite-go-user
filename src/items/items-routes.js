'use strict'

import { Router } from 'express';
import {
    addItemToActiveOrder,
    getItemsByOrder,
    updateItemInOrder,
    deleteItemFromOrder
} from './items-controller.js';
import { isOrderEditable } from '../../middlewares/validate-order-status.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';

const api = Router();

api.get('/:id_order', validateJWT, getItemsByOrder);
api.post('/add/:id_order', validateJWT, isOrderEditable, addItemToActiveOrder);
api.put('/:id_order/:id_item', validateJWT, isOrderEditable, updateItemInOrder);
api.delete('/:id_order/:id_item', validateJWT, isOrderEditable, deleteItemFromOrder);

export default api;