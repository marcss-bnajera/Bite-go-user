import { Router } from "express";
import { validateJWT } from "../../middlewares/validate-jwt.js";
import {
    validateCreateReview,
    validateRestaurantParam
} from "../../middlewares/reviewsRatings-validator.js";
import {
    createReview,
    getMyReviews,
    getRestaurantReviews,
    getEligibleForReview
} from "./reviewsRatings-controller.js";

const router = Router();

// GET - Mis calificaciones
router.get("/", validateJWT, getMyReviews);

// GET - Elementos calificables de un restaurante
router.get("/eligible/:id_restaurante", validateJWT, validateRestaurantParam, getEligibleForReview);

// GET - Calificaciones públicas de un restaurante
router.get("/restaurant/:id_restaurante", validateRestaurantParam, getRestaurantReviews);

// POST - Calificar un pedido o reservación
router.post("/", validateJWT, validateCreateReview, createReview);

export default router;
