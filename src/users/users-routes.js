import { Router } from "express";
import {
    register,
    updateUser,
    login,
    getUserById
} from "./users-controller.js";
import { validateJWT } from "../../middlewares/validate-jwt.js";

const router = Router();

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Users]
 *     responses:
 *       201:
 *         description: Usuario creado con éxito
 *       400:
 *         description: Error en los datos enviados
 *
 * /users/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Login exitoso, devuelve un token
 *       401:
 *         description: Credenciales incorrectas
 *
 * /users/{id}:
 *   put:
 *     summary: Actualizar datos del usuario (Requiere Token)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       401:
 *         description: No autorizado (Falta JWT)
 *
 *   get:
 *     summary: Obtener perfil de usuario por ID (Requiere Token)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Datos del usuario encontrados
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/register', register);
router.post('/login', login);
router.put('/:id', validateJWT, updateUser);

router.get('/:id', validateJWT, getUserById);

export default router;