import { Router } from "express";
import {
    register,
    updateUser,
    login,
    getUserById
} from "./users-controller.js";
import { validateJWT } from "../../middlewares/validate-jwt.js";

const router = Router();

// Rutas publicas
router.post('/register', register);
router.post('/login', login);

// Rutas protegidas
router.put('/:id', validateJWT, updateUser);

router.get('/:id', validateJWT, getUserById);

export default router;