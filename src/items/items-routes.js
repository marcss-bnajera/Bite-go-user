'use strict'

import { Router } from 'express';
import {
    addItemToActiveOrder,
    getItemsByOrder,
    updateItemInOrder,
    deleteItemFromOrder
} from './items-controller.js';
import { isOrderEditable } from '../../middlewares/validate-order-status.js';

const api = Router();

api.get('/:id_order', getItemsByOrder);
api.post('/add/:id_order', [isOrderEditable], addItemToActiveOrder);
api.put('/:id_order/:id_item', [isOrderEditable], updateItemInOrder);
api.delete('/:id_order/:id_item', [isOrderEditable], deleteItemFromOrder);

export default api;