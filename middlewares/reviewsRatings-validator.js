import { body, param } from 'express-validator';
import { checkValidators } from './check-validators.js';

/**
 * Validaciones para calificar un pedido o reservación
 */
export const validateCreateReview = [
    body('id_pedido')
        .optional({ nullable: true })
        .isMongoId().withMessage('ID de pedido no válido'),

    body('id_reservacion')
        .optional({ nullable: true })
        .isMongoId().withMessage('ID de reservación no válido'),

    body('calificacion')
        .notEmpty().withMessage('La calificación es obligatoria')
        .isInt({ min: 1, max: 5 }).withMessage('La calificación debe ser un número entero entre 1 y 5'),

    body('comentario')
        .optional({ nullable: true })
        .isString().withMessage('El comentario debe ser texto')
        .isLength({ max: 500 }).withMessage('El comentario no puede superar los 500 caracteres'),

    body().custom((value) => {
        if (!value.id_pedido && !value.id_reservacion) {
            throw new Error('Debes enviar un id_pedido o un id_reservacion');
        }
        return true;
    }),

    checkValidators
];

export const validateRestaurantParam = [
    param('id_restaurante').isMongoId().withMessage('ID de restaurante no válido'),
    checkValidators
];
