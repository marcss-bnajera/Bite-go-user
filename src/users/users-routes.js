import { Router } from "express";
import {
    register,
    updateUser,
    getUserById
} from "./users-controller.js";
import { validateJWT } from "../../middlewares/validate-jwt.js";
import { body, param } from "express-validator";
import { checkValidators } from "../../middlewares/check-validators.js";

const router = Router();

router.post('/register', [
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
    body('email').isEmail().withMessage('El correo no es válido'),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
    checkValidators
], register);

router.put('/:id', validateJWT, [
    param('id').isMongoId().withMessage('ID de usuario no válido'),
    checkValidators
], updateUser);

router.get('/:id', validateJWT, [
    param('id').isMongoId().withMessage('ID de usuario no válido'),
    checkValidators
], getUserById);

export default router;