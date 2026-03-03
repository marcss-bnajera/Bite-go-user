import { Router } from "express";
import {
    register,
    updateUser,
    login,
    getUserById
} from "./users-controller.js";

const router = Router();

router.post('/register', register);

router.put('/:id', updateUser);

router.post('/login', login);

router.get('/:id', getUserById);

export default router;