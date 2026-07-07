// Importaciones
import { Router } from "express";
import { validateJWT } from "../../middlewares/validate-jwt.js";
import { param } from "express-validator";
import { checkValidators } from "../../middlewares/check-validators.js";

// Importacion de controladores
import {
    getMyReservations,
    createReservation,
    deleteReservation
} from "./reservations-controller.js";

const router = Router();

// GET - Obtener mis reservaciones
router.get("/", validateJWT, getMyReservations);

// POST - Registrar nueva reservacion
router.post("/", validateJWT, createReservation);

// DELETE - Cancelar reservacion por ID
router.delete("/:id", validateJWT, [
    param('id').isMongoId().withMessage('ID de reservación no válido'),
    checkValidators
], deleteReservation);

// Exportar rutas
export default router;