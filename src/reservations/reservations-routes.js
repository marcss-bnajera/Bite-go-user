// Importaciones
import { Router } from "express";
import { validateJWT } from "../../middlewares/validate-jwt.js";

// Importacion de controladores
import {
    getMyReservations,
    createReservation,
    deleteReservation
} from "./reservations-controller.js";

const router = Router();

// GET - Obtener todas las reservaciones
router.get("/", validateJWT, getMyReservations);

// POST - Registrar nueva reservacion
router.post("/", validateJWT, createReservation);

// DELETE - Cancelar reservacion por ID
router.delete("/:id", validateJWT, deleteReservation);

// Exportar rutas
export default router;