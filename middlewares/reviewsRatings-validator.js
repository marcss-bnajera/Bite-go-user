import { body, param } from 'express-validator';
import { checkValidators } from './check-validators.js';

/**
 * Validaciones para calificar un pedido
 */
export const validateCreateReview = [
    body('id_pedido')
        .notEmpty().withMessage('El ID del pedido es obligatorio')
        .isMongoId().withMessage('ID de pedido no válido'),

    body('calificacion')
        .notEmpty().withMessage('La calificación es obligatoria')
        .isInt({ min: 1, max: 5 }).withMessage('La calificación debe ser un número entero entre 1 y 5'),

    body('comentario')
        .optional({ nullable: true })
        .isString().withMessage('El comentario debe ser texto')
        .isLength({ max: 500 }).withMessage('El comentario no puede superar los 500 caracteres'),

    checkValidators
];

export const validateRestaurantParam = [
    param('id_restaurante').isMongoId().withMessage('ID de restaurante no válido'),
    checkValidators
];
